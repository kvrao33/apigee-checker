#!/usr/bin/env node

/*
  Apigee Checker CLI
  Inspired by ApigeeLint CLI
*/

const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");
const { extractedAPIProxyData } = require("../src/loader/extractedProxyFromXML");
const { printValidationResultTable, generateHtml } = require("../src/services/table");
const { validateAllFlows } = require("../src/services/validateAllFlows");
const { downloadProxyBundle } = require("../src/services/downloader");

const program = new Command();

program
  .name("apigee-checker")
  .description("CLI to validate Apigee API Proxies using custom rules")
  .version(pkg.version)
  .option(
    "-s, --path <path>",
    "Path of the proxy bundle to analyze (directory containing apiproxy/)"
  )
  .option(
    "-o, --org <organization>",
    "Apigee organization name for remote proxy"
  )
  .option(
    "-e, --env <environment>",
    "Apigee environment name for remote proxy"
  )
  .option(
    "-t, --token <token>",
    "Access token for Apigee authentication"
  )
  .option(
    "-n, --name <proxyName>",
    "Name of the proxy to analyze from Apigee"
  )
  .option(
    "-v, --revision <revision>",
    "Specific revision of the proxy to analyze (default: latest deployed revision if env is specified, otherwise latest revision)"
  )
  .option(
    "-r, --rules <file>",
    "Path to JSON file with rules (default: ./config/default.json)"
  )
  .option(
    "-f, --formatter [value]",
    "Formatter type: table | json | html (default: table)",
    "table"
  )
  .option("-q, --quiet", "Suppress output, useful when writing results to file")
  .option(
    "-w, --write [file]",
    "File path to write results (optional, supports .json, .html, or .txt extensions)"
  );

program.on("--help", () => {
  console.log("\nExamples:");
  console.log("Local Proxy Testing:");
  console.log("   apigee-checker -s ./testingProxy/");
  console.log("   apigee-checker -s ./testingProxy/ -r ./myRules.json -f json");
  console.log("   apigee-checker -s ./testingProxy/ -w results.json -f json");
  console.log("\nRemote Proxy Testing:");
  console.log("   apigee-checker -o myorg -n myproxy -t mytoken");
  console.log("   apigee-checker -o myorg -n myproxy -e test -t mytoken -r ./myRules.json");
  console.log("   apigee-checker -o myorg -n myproxy -t mytoken -v 2 -f json");
  console.log("   apigee-checker -o myorg -n myproxy -t mytoken -f json -w results.json");
});

(async () => {
  program.parse(process.argv);
  const options = program.opts();

  try {
    // Validate input parameters
    if (!options.path && !(options.org && options.name)) {
      console.error("❌ You must either specify a local path (-s) or provide organization (-o) and proxy name (-n)");
      process.exit(1);
    }

    if (options.org && (!options.token || !options.name)) {
      console.error("❌ When using remote proxy, you must provide organization (-o), token (-t), and proxy name (-n)");
      process.exit(1);
    }

    // load rules file
    let rules = {};
    if (options.rules && fs.existsSync(options.rules)) {
      rules = require(path.resolve(options.rules));
    } else {
      rules = require("../config/default.json");
    }

    // Handle proxy source
    let proxyPath = options.path;
    if (!proxyPath) {
      try {
        console.log("📥 Downloading proxy bundle from Apigee...");
        const downloadResult = await downloadProxyBundle({
          proxyName: options.name,
          org: options.org,
          token: options.token,
          env: options.env,
          rev: options.revision
        });
        
        if (!downloadResult) {
          console.error("❌ Failed to download proxy bundle");
          process.exit(1);
        }
        console.log(`✅ Successfully downloaded proxy bundle (revision: ${downloadResult.revision})`);
        proxyPath = downloadResult.path;
      } catch (error) {
        console.error("❌ Failed to download proxy bundle:", error.message);
        process.exit(1);
      }
    }

    // run extraction + validation
    console.log("🔍 Analyzing proxy...");
    
    // Determine the correct path to apiproxy
    let apiProxyPath = proxyPath;
    if (!proxyPath.endsWith('apiproxy')) {
      apiProxyPath = path.join(proxyPath, 'apiproxy');
    }
    
    // Verify the apiproxy directory exists
    if (!fs.existsSync(apiProxyPath)) {
      console.error(`❌ apiproxy directory not found at: ${apiProxyPath}`);
      process.exit(1);
    }

    const proxyData = await extractedAPIProxyData(apiProxyPath);
    
    if (!proxyData || !proxyData.policies || !proxyData.proxies || !proxyData.targets) {
      console.error("❌ Failed to extract proxy data");
      process.exit(1);
    }

    const validation = validateAllFlows(proxyData, rules);
    
    if (!validation || !validation.results) {
      console.error("❌ No validation results generated");
      process.exit(1);
    }
    
    // format output and handle results
    let summary;
    let outputContent;

    if (!options.quiet) {
      if (options.formatter === "json") {
        outputContent = JSON.stringify(validation, null, 2);
        console.log(outputContent);
      } else if (options.formatter === "html") {
        const htmlResult = generateHtml(validation.results);
        outputContent = htmlResult.html;
        summary = htmlResult.summary;
        
        // Print HTML content
        console.log("\n📋 Validation Results (HTML Format):");
        console.log("═".repeat(80));
        console.log(outputContent);
        console.log("═".repeat(80));
        
        // Print summary after HTML
        console.log("\n📊 Summary:");
        console.log(`Total Rules Checked: ${summary.totalRules}`);
        console.log(`✅ Passed: ${summary.totalPassed}`);
        console.log(`❌ Failed: ${summary.totalFailed}`);
      } else {
        console.log("\n📋 Validation Results:");
        summary = printValidationResultTable(validation.results);
        outputContent = JSON.stringify(validation, null, 2);
      }
    }

    // write to file if specified
    if (options.write) {
      const outputPath = path.resolve(options.write);
      const ext = path.extname(outputPath).toLowerCase();
      
      // Determine content type based on file extension
      let contentToWrite = outputContent;
      if (ext === '.json') {
        contentToWrite = JSON.stringify(validation, null, 2);
      } else if (ext === '.html') {
        contentToWrite = generateHtml(validation.results).html;
      }

      fs.writeFileSync(outputPath, contentToWrite);
      console.log(`\n💾 Results written to: ${outputPath}`);
    }

    // Exit with error if any rules failed
    if (summary && summary.totalFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
