const { validateConditions } = require("./checker");

function extractSteps(
  endpointConfig,
  endpoint,
  flow,
  direction,
  ConditionalFlowName = ""
) {
  const getSteps = (stepObj) => {
    if (!stepObj) return [];
    // Normalize: if Step is array, return it; if object, wrap in array
    if (Array.isArray(stepObj)) return stepObj;
    return [stepObj];
  };

  if (flow === "ConditionalFlow") {
    const conditionalFlows = endpointConfig?.[endpoint]?.Flows?.Flow;
    if (!conditionalFlows || !Array.isArray(conditionalFlows)) return [];
    const targetedFlow = conditionalFlows.find(
      (f) => f?.["$"]?.name === ConditionalFlowName
    );
    if (!targetedFlow) return [];
    return getSteps(targetedFlow?.[direction]?.Step);
  }

  return getSteps(endpointConfig?.[endpoint]?.[flow]?.[direction]?.Step);
}



const validateAllFlows = (proxyConfig, validationRules) => {
  const { policies, proxies, targets } = proxyConfig;
    let results = [];
    let totalRules = 0;
    let successfulValidations = 0;
    let failedValidations = 0;
    const proxyEndpointRules = validationRules.flows.filter(f => f.endpoint === 'ProxyEndpoint');
    const targetEndpointRules = validationRules.flows.filter(f => f.endpoint === 'TargetEndpoint');
    proxies.forEach((proxy) => {
        const proxyEndpointName = proxy?.ProxyEndpoint?.["$"]?.name || "Unknown";

       let validationResults= []
       proxyEndpointRules.forEach((ruleSet) => {
            const {endpoint, flow, direction,conditions,conditionalFlowName=""} = ruleSet;
            const steps = extractSteps(proxy, endpoint, flow, direction,conditionalFlowName);
            const validationResult = validateConditions(steps, policies, conditions);
            const metConditionsCount = validationResult.filter(r => r.success).length;
            const notMetConditionsCount = validationResult.filter(r => !r.success).length;
             validationResults.push({validationResult,metConditionsCount,notMetConditionsCount,flow,direction,conditionalFlowName})
        })
        results.push({validationResults,endpoint:"ProxyEndpoint",name:proxyEndpointName})
    });
    targets.forEach((target) => {
        const targetEndpointName = target?.TargetEndpoint?.["$"]?.name || "Unknown";
        let validationResults = [];
        targetEndpointRules.forEach((ruleSet) => {
            const {endpoint, flow, direction,conditions,conditionalFlowName=""} = ruleSet;
            const steps = extractSteps(target, endpoint, flow, direction,conditionalFlowName);
            const validationResult = validateConditions(steps, policies, conditions);
            const metConditionsCount = validationResult.filter(r => r.success).length;
            const notMetConditionsCount = validationResult.filter(r => !r.success).length;
            validationResults.push({validationResult,metConditionsCount,notMetConditionsCount,flow,direction,conditionalFlowName})
        })
        results.push({validationResults,endpoint:"TargetEndpoint",name:targetEndpointName})
    });
    return results;
};

module.exports = { extractSteps , validateAllFlows};
