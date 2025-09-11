/**
 * Checks if the steps satisfies each of the given condition(s).
 * @param {Array} steps - Array of objects with "Name" property.
 * @param {Array} policies - Array of policy objects (with name, type, etc.).
 * @param {Object} condition - single condition.
 * @returns {Array} - [{ passed: boolean, description: string }]
 */

function isConditionMet(steps, policies, condition) {
  // Convert policies into a Map for fast lookup
  const policyMap = new Map(policies.map((p) => [p.name, p]));

  if (condition.type === "Policy") {
    // Check if ANY step matches the condition
    return steps.some((step) => {
      const policy = policyMap.get(step.Name);
      return policy && policy.type === condition.name;
    });
  } else {
    return steps.some((step) => {
      const policy = policyMap.get(step.Name);
      return policy && policy.SharedFlowBundle === condition.name;
    });
  }
}

module.exports = {isConditionMet};
