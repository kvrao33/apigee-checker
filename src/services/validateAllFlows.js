
function extractSteps(endpointConfig, endpoint, flow, direction, ConditionalFlowName = "") {
  const getSteps = (stepObj) => {
    if (!stepObj) return [];
    // Normalize: if Step is array, return it; if object, wrap in array
    if (Array.isArray(stepObj)) return stepObj;
    return [stepObj];
  };

  if (flow === "ConditionalFlow") {
    const conditionalFlows = endpointConfig?.[endpoint]?.Flows?.Flow;
    if (!conditionalFlows || !Array.isArray(conditionalFlows)) return [];
    const targetedFlow = conditionalFlows.find((f) => f?.["$"]?.name === ConditionalFlowName);
    if (!targetedFlow) return [];
    return getSteps(targetedFlow?.[direction]?.Step);
  }

  return getSteps(endpointConfig?.[endpoint]?.[flow]?.[direction]?.Step);
}

module.exports = { extractSteps };
