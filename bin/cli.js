#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import { assessApigeeProxy } from '../index.js'; // Import the new programmatic entry point

const program = new Command();

program
  .name('apigee-check')
  .description('Extensible Apigee X proxy assessment tool')
  .option('-b, --bundle <path>', 'Path to extracted Apigee proxy bundle')
  .option('-c, --config <path>', 'Path to config JSON file', './config/defaultRules.json')
  .option('-o, --output <file>', 'Path to output report', './report.json');

program.parse(process.argv);
const opts = program.opts();

if (!opts.bundle) {
  console.error('❌ Proxy bundle path is required (use -b)');
  process.exit(1);
}

let config = null;
try {
  // Read config only if it's not the default path (or if default needs to be overridden)
  if (opts.config !== './config/defaultRules.json' || fs.existsSync(opts.config)) {
    config = JSON.parse(fs.readFileSync(opts.config, 'utf8'));
  }
} catch (error) {
  console.error(`❌ Error reading config file at ${opts.config}: ${error.message}`);
  process.exit(1);
}

// The assessApigeeProxy function now handles the default config if 'config' is null
assessApigeeProxy(opts.bundle, config).then(result => {
  fs.writeFileSync(opts.output, JSON.stringify(result, null, 2));
  console.log(`✅ Report written to ${opts.output}`);
}).catch(error => {
  console.error(`❌ An error occurred during assessment: ${error.message}`);
  process.exit(1);
});