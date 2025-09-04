#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

/* =========================
 * Utils
 * ========================= */
function ensureArray(x) {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function normalizeName(name) {
  if (!name) return "";
  return String(name).replace(/-\d+$/i, "").trim().toLowerCase();
}

function readFileUtf8(p) {
  return fs.readFileSync(p, "utf-8");
}

function listXmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith(".xml"))
    .map(f => path.join(dir, f));
}

/* =========================
 * Load Spec + Proxy Bundle
 * ========================= */
function loadSpecification(filePath) {
  return JSON.parse(readFileUtf8(filePath));
}

function parseXmlFile(filePath) {
  const parser = new XMLParser({ ignoreAttributes: false });
  return parser.parse(readFileUtf8(filePath));
}
function getRootType(policyJson) {
  if (!policyJson) return null;

  // get the root element (first key)
  const keys = Object.keys(policyJson);
  if (keys.length === 0) return null;

  return keys[0].toLowerCase();
}

function loadPolicies(policiesDir) {
  const files = listXmlFiles(policiesDir);
  const policies = {}; // name -> { name, rootType, details }
  for (const file of files) {
    const obj = parseXmlFile(file);
    console.log(`object: ${JSON.stringify(obj, null, 2)}`);
    
    // Root element is the policy type (e.g., SpikeArrest, Quota, OAuthV2, FlowCallout, etc.)
    const rootType = getRootType(obj);
    const node = obj[rootType] || {};
    const nameAttr = node["@_name"] || path.basename(file, ".xml");
    const name = String(nameAttr);
    const details = {};

    // Special handling for FlowCallout to capture SharedFlow reference
    if (rootType.toLowerCase() === "flowcallout") {
      // Apigee FlowCallout: <FlowCallout name="..."><SharedFlowBundle>access-auth-sharedflow</SharedFlowBundle></FlowCallout>
      if (node.SharedFlowBundle) {
        details.sharedFlowRef = String(node.SharedFlowBundle).trim();
      }
    }

    policies[name] = { name, rootType, details, file };
  }
  return policies;
}

function extractSteps(section) {
  // Section looks like { Request: { Step: [{Name: "X"}] }, Response: { Step: ... } }
  if (!section) return { request: [], response: [] };

  const reqSteps = ensureArray(section.Request?.Step).map(s => s?.Name).filter(Boolean);
  const resSteps = ensureArray(section.Response?.Step).map(s => s?.Name).filter(Boolean);

  return {
    request: reqSteps.map(String),
    response: resSteps.map(String),
  };
}

function parseProxyEndpoint(xml) {
  // xml has shape { ProxyEndpoint: { PreFlow, PostFlow, Flows: { Flow: [...] } } }
  const root = xml.ProxyEndpoint;
  const endpointName = root["@_name"] || "default";
  const flows = [];

  // PreFlow
  if (root.PreFlow) {
    const steps = extractSteps(root.PreFlow);
    flows.push({
      endpoint: "ProxyEndpoint",
      endpointName,
      flow: "PreFlow",
      direction: "Request",
      steps: steps.request,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PreFlow
    });
    flows.push({
      endpoint: "ProxyEndpoint",
      endpointName,
      flow: "PreFlow",
      direction: "Response",
      steps: steps.response,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PreFlow
    });
  }

  // PostFlow
  if (root.PostFlow) {
    const steps = extractSteps(root.PostFlow);
    flows.push({
      endpoint: "ProxyEndpoint",
      endpointName,
      flow: "PostFlow",
      direction: "Request",
      steps: steps.request,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PostFlow
    });
    flows.push({
      endpoint: "ProxyEndpoint",
      endpointName,
      flow: "PostFlow",
      direction: "Response",
      steps: steps.response,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PostFlow
    });
  }

  // Conditional Flows
  const condFlows = ensureArray(root.Flows?.Flow);
  for (const flow of condFlows) {
    const conditionExpr = (flow.Condition != null) ? String(flow.Condition) : null;
    const steps = extractSteps(flow);
    flows.push({
      endpoint: "ProxyEndpoint",
      endpointName,
      flow: "ConditionalFlow",
      direction: "Request",
      steps: steps.request,
      conditionExpr,
      ...inferMethodsAndPathSuffix(conditionExpr),
      raw: flow
    });
    flows.push({
      endpoint: "ProxyEndpoint",
      endpointName,
      flow: "ConditionalFlow",
      direction: "Response",
      steps: steps.response,
      conditionExpr,
      ...inferMethodsAndPathSuffix(conditionExpr),
      raw: flow
    });
  }

  return flows;
}

function parseTargetEndpoint(xml) {
  // xml has shape { TargetEndpoint: { PreFlow, PostFlow, Flows } }
  const root = xml.TargetEndpoint;
  const endpointName = root["@_name"] || "default";
  const flows = [];

  if (root.PreFlow) {
    const steps = extractSteps(root.PreFlow);
    flows.push({
      endpoint: "TargetEndpoint",
      endpointName,
      flow: "PreFlow",
      direction: "Request",
      steps: steps.request,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PreFlow
    });
    flows.push({
      endpoint: "TargetEndpoint",
      endpointName,
      flow: "PreFlow",
      direction: "Response",
      steps: steps.response,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PreFlow
    });
  }

  if (root.PostFlow) {
    const steps = extractSteps(root.PostFlow);
    flows.push({
      endpoint: "TargetEndpoint",
      endpointName,
      flow: "PostFlow",
      direction: "Request",
      steps: steps.request,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PostFlow
    });
    flows.push({
      endpoint: "TargetEndpoint",
      endpointName,
      flow: "PostFlow",
      direction: "Response",
      steps: steps.response,
      conditionExpr: null,
      methods: null,
      pathSuffixes: null,
      raw: root.PostFlow
    });
  }

  const condFlows = ensureArray(root.Flows?.Flow);
  for (const flow of condFlows) {
    const conditionExpr = (flow.Condition != null) ? String(flow.Condition) : null;
    const steps = extractSteps(flow);
    flows.push({
      endpoint: "TargetEndpoint",
      endpointName,
      flow: "ConditionalFlow",
      direction: "Request",
      steps: steps.request,
      conditionExpr,
      ...inferMethodsAndPathSuffix(conditionExpr),
      raw: flow
    });
    flows.push({
      endpoint: "TargetEndpoint",
      endpointName,
      flow: "ConditionalFlow",
      direction: "Response",
      steps: steps.response,
      conditionExpr,
      ...inferMethodsAndPathSuffix(conditionExpr),
      raw: flow
    });
  }

  return flows;
}

function loadProxyBundle(bundlePath) {
  const proxiesDir = path.join(bundlePath, "proxies");
  const targetsDir = path.join(bundlePath, "targets");
  const policiesDir = path.join(bundlePath, "policies");

  const policies = loadPolicies(policiesDir);

  const proxyEndpointFiles = listXmlFiles(proxiesDir);
  const targetEndpointFiles = listXmlFiles(targetsDir);

  const allFlows = [];

  for (const file of proxyEndpointFiles) {
    const xml = parseXmlFile(file);
    if (xml.ProxyEndpoint) {
      allFlows.push(...parseProxyEndpoint(xml));
    }
  }
  for (const file of targetEndpointFiles) {
    const xml = parseXmlFile(file);
    if (xml.TargetEndpoint) {
      allFlows.push(...parseTargetEndpoint(xml));
    }
  }

  return { policies, flows: allFlows };
}

/* =========================
 * Flow Matching Helpers
 * ========================= */
function inferMethodsAndPathSuffix(conditionExpr) {
  // Heuristic parsing. We don’t fully parse Apigee conditions; we detect:
  //   request.verb == "POST"
  //   proxy.pathsuffix MatchesPath "/validate"
  // Return arrays of lowercased methods and raw path suffix strings we detect.
  if (!conditionExpr) return { methods: null, pathSuffixes: null };

  const methods = [];
  const pathSuffixes = [];

  // Methods: look for request.verb and common operators
  const verbRegex = /request\.verb\s*(==|=~|eq|equals|in)\s*(?:\"([A-Z]+)\"|\(([^)]+)\))/gi;
  let m;
  while ((m = verbRegex.exec(conditionExpr)) !== null) {
    if (m[2]) {
      methods.push(m[2].toUpperCase());
    } else if (m[3]) {
      // list like ("POST","GET")
      const list = m[3].split(/[, ]+/).map(s => s.replace(/["']/g, "").trim()).filter(Boolean);
      methods.push(...list.map(s => s.toUpperCase()));
    }
  }

  // Path suffix: proxy.pathsuffix MatchesPath "/validate"
  const pathRegex = /proxy\.pathsuffix\s*(MatchesPath|==|=~|eq|equals)\s*\"([^\"]+)\"/gi;
  let p;
  while ((p = pathRegex.exec(conditionExpr)) !== null) {
    pathSuffixes.push(p[2]);
  }

  return {
    methods: methods.length ? methods : null,
    pathSuffixes: pathSuffixes.length ? pathSuffixes : null
  };
}

function flowMatchesSpec(flowSpec, candidateFlow) {
  if (flowSpec.endpoint && flowSpec.endpoint !== candidateFlow.endpoint) return false;
  if (flowSpec.flow && flowSpec.flow !== candidateFlow.flow) return false;
  if (flowSpec.direction && flowSpec.direction !== candidateFlow.direction) return false;

  // ConditionalFlow extra checks
  if (flowSpec.flow === "ConditionalFlow") {
    if (!checkMethodsAndPath(flowSpec, candidateFlow)) return false;
  }
  return true;
}

function findMatchingFlow(allFlows, flowSpec) {
  // Return the first best match. You could also return all matches if needed.
  return allFlows.find(f => flowMatchesSpec(flowSpec, f)) || null;
}

/* =========================
 * Validation Core
 * ========================= */
function checkMethodsAndPath(flowSpec, proxyFlow) {
  // If spec provides methods, ensure proxyFlow condition implies them.
  if (flowSpec.methods && flowSpec.methods.length) {
    const specMethods = flowSpec.methods.map(m => m.toUpperCase());
    const flowMethods = proxyFlow.methods ? proxyFlow.methods.map(m => m.toUpperCase()) : [];
    // If flow didn’t declare methods, we can’t guarantee it matches
    if (!flowMethods.length) return false;
    const allIncluded = specMethods.every(m => flowMethods.includes(m));
    if (!allIncluded) return false;
  }

  if (flowSpec.pathSuffixes && flowSpec.pathSuffixes.length) {
    const specPaths = flowSpec.pathSuffixes;
    const flowPaths = proxyFlow.pathSuffixes || [];
    if (!flowPaths.length) return false;
    const allIncluded = specPaths.every(p => flowPaths.includes(p));
    if (!allIncluded) return false;
  }

  return true;
}

function validateFlow(flowSpec, proxyFlow, ctx) {
  if (!proxyFlow) {
    return {
      flow: flowSpec,
      results: [{
        description: `Flow not found: ${flowSpec.endpoint} ${flowSpec.flow} ${flowSpec.direction || ""}`.trim(),
        passed: false,
        reason: "No matching flow in proxy"
      }]
    };
  }

  const results = [];
  for (const cond of ensureArray(flowSpec.conditions)) {
    results.push(validateCondition(cond, proxyFlow, ctx));
  }
  return { flow: flowSpec, results };
}

function validateCondition(condition, proxyFlow, ctx) {
  const description = condition.description || `${condition.name || "Condition"}`;
  if (condition.anyOf) {
    return checkAnyOf(condition.anyOf, proxyFlow, ctx, description);
  }
  if (condition.allOf) {
    return checkAllOf(condition.allOf, proxyFlow, ctx, description);
  }
  if (condition.name) {
    return checkSingle(condition, proxyFlow, ctx, description);
  }
  return { description, passed: false, reason: "Unknown condition type" };
}

function checkAnyOf(list, proxyFlow, ctx, description) {
  for (const item of ensureArray(list)) {
    const ok = doesItemExistInFlow(item, proxyFlow, ctx);
    if (ok) return { description, passed: true };
  }
  return { description, passed: false, reason: "None of the alternatives found" };
}

function checkAllOf(list, proxyFlow, ctx, description) {
  for (const item of ensureArray(list)) {
    const ok = doesItemExistInFlow(item, proxyFlow, ctx);
    if (!ok) {
      return { description, passed: false, reason: `${item.name} missing` };
    }
  }
  return { description, passed: true };
}

function checkSingle(item, proxyFlow, ctx, description) {
  const ok = doesItemExistInFlow(item, proxyFlow, ctx);
  return { description, passed: !!ok, reason: ok ? null : `${item.name} not found` };
}

function doesItemExistInFlow(item, proxyFlow, ctx) {
  const name = String(item.name);
  const type = String(item.type || "Policy");
  if (type.toLowerCase() === "sharedflow") {
    return hasSharedFlowReferenceInFlow(name, proxyFlow, ctx);
  }
  // Regular policy presence (by step name)
  return hasPolicyStepInFlow(name, proxyFlow, ctx);
}

/* =========================
 * Step/Policy Presence Logic
 * ========================= */
function hasPolicyStepInFlow(policyName, proxyFlow, ctx) {
  // Step names are policy names. We check if there is a step with the expected name.
  // Use normalize rules to allow SpikeArrest-1 to match SpikeArrest, etc.
  const targetNorm = normalizeName(policyName);
  for (const stepName of proxyFlow.steps) {
    if (normalizeName(stepName) === targetNorm) {
      // Optional: also confirm the policy actually exists in /policies map
      if (!ctx.policies[stepName]) {
        // Still accept (step attached), but you can tighten this if you want.
        return true;
      }
      return true;
    }
  }
  return false;
}

function hasSharedFlowReferenceInFlow(sharedFlowName, proxyFlow, ctx) {
  const targetSharedFlowNorm = normalizeName(sharedFlowName);

  // A shared flow call appears as a Step that references a FlowCallout policy.
  // That FlowCallout policy must contain <SharedFlowBundle>the-name</SharedFlowBundle>.
  for (const stepName of proxyFlow.steps) {
    const policy = ctx.policies[stepName];
    if (!policy) continue;
    if (normalizeName(policy.rootType) !== "flowcallout") continue;

    const ref = policy.details.sharedFlowRef ? normalizeName(policy.details.sharedFlowRef) : "";
    if (ref && ref === targetSharedFlowNorm) {
      return true;
    }
  }
  return false;
}

/* =========================
 * Reporting
 * ========================= */
function generateReport(results) {
  const passed = results.filter(r => r.results.every(c => c.passed)).length;
  const failed = results.length - passed;
  return {
    summary: { total: results.length, passed, failed },
    details: results
  };
}

function printReport(report) {
  console.log("===== Apigee Proxy Validation Report =====");
  console.log(`Total Flows Checked: ${report.summary.total}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log("------------------------------------------");
  for (const flow of report.details) {
    const f = flow.flow;
    const header = `${f.endpoint} :: ${f.flow}${f.direction ? ` :: ${f.direction}` : ""}`;
    console.log(header);
    for (const r of flow.results) {
      console.log(`  • ${r.description}: ${r.passed ? "✅" : `❌ (${r.reason})`}`);
    }
    console.log("");
  }
}

/* =========================
 * Main
 * ========================= */
function main() {
  const specPath = process.argv[2] || "rules.json";
  const bundlePath = process.argv[3] || "proxybundle";

  if (!fs.existsSync(specPath)) {
    console.error(`Spec not found: ${specPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(bundlePath)) {
    console.error(`Bundle path not found: ${bundlePath}`);
    process.exit(1);
  }

  const spec = loadSpecification(specPath);
  const proxy = loadProxyBundle(bundlePath);

  const ctx = { policies: proxy.policies };

  const results = [];
  for (const flowSpec of ensureArray(spec.flows)) {
    const proxyFlow = findMatchingFlow(proxy.flows, flowSpec);
    const r = validateFlow(flowSpec, proxyFlow, ctx);
    results.push(r);
  }

  const report = generateReport(results);
  printReport(report);

  // Optionally: exit non-zero on failures
  if (report.summary.failed > 0) process.exitCode = 2;
}

if (require.main === module) {
  main();
}

module.exports = {
  // Exported for testing or reuse
  loadSpecification,
  loadProxyBundle,
  parseXmlFile,
  generateReport,
  printReport,
  validateFlow,
  checkMethodsAndPath,
  hasPolicyStepInFlow,
  hasSharedFlowReferenceInFlow,
  normalizeName,
};
