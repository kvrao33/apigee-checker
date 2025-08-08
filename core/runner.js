// === core/runner.js ===
import path from 'path';
import { readXML, listXMLFiles } from '../lib/xmlUtils.js';
import * as SharedFlowCheck from '../checks/SharedFlowCheck.js';

const checks = [SharedFlowCheck];

export async function runAssessment(proxyPath, config) {
  const proxyDir = path.join(proxyPath, 'apiproxy/proxies');
  const targetDir = path.join(proxyPath, 'apiproxy/targets');
  const policyDir = path.join(proxyPath, 'apiproxy/policies');

  const policyMap = {};
  for (const f of listXMLFiles(policyDir)) {
    policyMap[f.replace('.xml', '')] = readXML(path.join(policyDir, f));
  }

  const endpointXmls = {
    ProxyEndpoint: listXMLFiles(proxyDir).map(f => readXML(path.join(proxyDir, f))),
    TargetEndpoint: listXMLFiles(targetDir).map(f => readXML(path.join(targetDir, f)))
  };

  const reports = [];

  for (const proxyFile of listXMLFiles(proxyDir)) {
    const proxy = readXML(path.join(proxyDir, proxyFile)).ProxyEndpoint; // Assuming ProxyEndpoint is the root of the proxy XML

    const result = {
      endpoint: proxyFile,
      checks: []
    };

    for (const check of checks) {
      // Pass the complete endpointXmls map to the checks
      result.checks.push(check.run(endpointXmls, config));
    }

    reports.push(result);
  }

  return reports;
}