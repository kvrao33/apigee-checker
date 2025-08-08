// apigeeCheckRunner.mjs
import fs from 'fs-extra';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true
});

// === CONFIG ===
const bundlePath = '/home/niveus/Apigee/apigee-checker/proxybundle'; // << Change this
const configPath = './config/defaultRules.json';       // << Or inline config if needed
const outputPath = './report.json';                    // Optional output path

// === UTILITIES ===
function readXML(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parser.parse(content);
}

function listXMLFiles(dirPath) {
  return fs.readdirSync(dirPath).filter(f => f.endsWith('.xml'));
}

function getSteps(container, flow, direction) {
  if (!container) return [];
  const flowSection = container[flow];
  if (!flowSection) return [];
  const steps = flowSection[direction]?.Step;
  if (!steps) return [];
  return Array.isArray(steps) ? steps.map(s => s.Name) : [steps.Name];
}

// === CHECKS ===
function runSharedFlowCheck(endpointXmls, config, policyMap) {
  const violations = [];

  for (const rule of config.flowChecks || []) {
    const { name, endpoint, flow, direction, description, type, checkPolicySettings, methods, pathSuffixes } = rule;
    const xmls = endpointXmls[endpoint] || [];
    let found = false;
    let matchedFlows = [];

    for (const xml of xmls) {
      const container = xml[endpoint];
      if (!container) continue;

      // Conditional flow filtering
      const flows = flow === 'ConditionalFlow'
        ? container?.Flows?.Flow || []
        : [{ name: flow, ...container[flow] }];

      const flowList = Array.isArray(flows) ? flows : [flows];

      for (const f of flowList) {
        const matchesMethod = !methods || (f?.Condition?.includes?.('request.verb') && methods.some(m => f.Condition.includes(m)));
        const matchesPath = !pathSuffixes || (f?.Condition?.includes?.('proxy.pathsuffix') && pathSuffixes.some(p => f.Condition.includes(p)));

        if (flow !== 'ConditionalFlow' || (matchesMethod && matchesPath)) {
          const steps = getSteps(f, direction);
          if (steps.includes(name)) {
            found = true;
            matchedFlows.push({ flowName: f.name || flow, condition: f.Condition || 'N/A' });

            // Additional policy checks
            if (type === 'Policy' && checkPolicySettings) {
              const policyXml = policyMap[name];
              if (policyXml) {
                const policy = policyXml[name];
                if (policy && (policy.enabled === 'false' || policy.continueOnError === 'true')) {
                  violations.push({
                    name,
                    type,
                    description: `Policy '${name}' should be enabled and continueOnError should be false`,
                    details: { enabled: policy.enabled, continueOnError: policy.continueOnError }
                  });
                }
              } else {
                violations.push({
                  name,
                  type,
                  description: `Policy definition for '${name}' not found in policies folder`
                });
              }
            }
            break;
          }
        }
      }
    }

    if (!found) {
      violations.push({
        name,
        type,
        description: description || `Missing ${type} '${name}' in ${endpoint}.${flow}.${direction}`,
        rule: rule
      });
    }
  }

  return {
    id: 'sharedflow-check',
    description: 'Verify required policies/sharedflows are used in configured flows',
    passed: violations.length === 0,
    violations
  };
}


// === RUNNER ===
async function runAssessment(proxyPath, config) {
  const proxyDir = path.join(proxyPath, 'apiproxy/proxies');
  const targetDir = path.join(proxyPath, 'apiproxy/targets');
  const policyDir = path.join(proxyPath, 'apiproxy/policies');

  const endpointXmls = {
    ProxyEndpoint: listXMLFiles(proxyDir).map(f => readXML(path.join(proxyDir, f))),
    TargetEndpoint: listXMLFiles(targetDir).map(f => readXML(path.join(targetDir, f)))
  };

  const reports = [];

  for (const proxyFile of listXMLFiles(proxyDir)) {
    const proxy = readXML(path.join(proxyDir, proxyFile)).ProxyEndpoint;

    const result = {
      endpoint: proxyFile,
      checks: []
    };

    result.checks.push(runSharedFlowCheck(endpointXmls, config));

    reports.push(result);
  }

  return reports;
}

// === MAIN EXECUTION ===
async function main() {
  if (!bundlePath) {
    console.error('❌ Proxy bundle path is required');
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const report = await runAssessment(bundlePath, config);

  console.log('✅ Assessment complete. Report:');
  console.log(JSON.stringify(report, null, 2));

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report written to ${outputPath}`);
}

main().catch(err => {
  console.error('❌ Error running assessment:', err);
});
