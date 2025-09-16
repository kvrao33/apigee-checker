/**
 * Checks if the steps satisfies each of the given condition(s).
 * @param {Array} steps - Array of objects with "Name" property.
 * @param {Array} policies - Array of policy objects (with name, type, etc.).
 * @param {Object} condition - single condition.
 * @returns {boolean} - Whether the condition is met
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

/**
 * Validates multiple conditions against steps and policies.
 * @param {Array} steps - Array of objects with "Name" property
 * @param {Array} policies - Array of policy objects
 * @param {Array} conditions - Array of condition objects
 * @returns {Array} Array of validation results with success and error information
 */
function validateConditions(steps, policies, conditions) {
  const results = [];

  for (const condition of conditions) {
    if (condition.anyOf) {
      // Handle anyOf conditions
      const anyConditionMet = condition.anyOf.some(subCondition => 
        isConditionMet(steps, policies, subCondition)
      );
      
      results.push({
        success: anyConditionMet,
        description: condition.description,
        error: anyConditionMet ? null : 'None of the required authentication methods are present'
      });
    } 
    else if (condition.allOf) {
      // Handle allOf conditions
      const allConditionsMet = condition.allOf.every(subCondition => 
        isConditionMet(steps, policies, subCondition)
      );
      
      results.push({
        success: allConditionsMet,
        description: condition.description,
        error: allConditionsMet ? null : 'Not all required policies are present'
      });
    }
    else {
      // Handle single condition
      const conditionMet = isConditionMet(steps, policies, condition);
      
      results.push({
        success: conditionMet,
        description: condition.description,
        error: conditionMet ? null : `Required policy '${condition.name}' is not present`
      });
    }
  }

  return results;
}

module.exports = { isConditionMet, validateConditions };
