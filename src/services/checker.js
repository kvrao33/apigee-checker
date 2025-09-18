/**
 * Checks if the steps satisfies each of the given condition(s).
 * @param {Array} steps - Array of objects with "Name" property.
 * @param {Array} policies - Array of policy objects (with name, type, etc.).
 * @param {Object} condition - single condition.
 * @returns {boolean} - Whether the condition is met
 */
function isConditionMet(steps, policies, condition) {
  const policyMap = new Map(policies.map((p) => [p.name, p]));

  if (condition.type === "Policy") {
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
 * @returns {Array} Array of validation results with success and detailed info
 */
function validateConditions(steps, policies, conditions) {
  const results = [];

  for (const condition of conditions) {
    let metConditions = [];
    let notMetConditions = [];
    let success = false;

    if (condition.anyOf) {
      metConditions = condition.anyOf.filter((sub) =>
        isConditionMet(steps, policies, sub)
      );
      notMetConditions = condition.anyOf.filter(
        (sub) => !isConditionMet(steps, policies, sub)
      );
      success = metConditions.length > 0;
    } else if (condition.allOf) {
      metConditions = condition.allOf.filter((sub) =>
        isConditionMet(steps, policies, sub)
      );
      notMetConditions = condition.allOf.filter(
        (sub) => !isConditionMet(steps, policies, sub)
      );
      success = notMetConditions.length === 0;
    } else {
      const met = isConditionMet(steps, policies, condition);
      if (met) {
        metConditions.push(condition);
      } else {
        notMetConditions.push(condition);
      }
      success = met;
    }

    results.push({
      success,
      description: condition.description,
      metConditions,
      notMetConditions,
      message: success
        ? `Conditions met: ${metConditions.map((c) => c.name).join(", ")}`
        : `Conditions not met: ${notMetConditions.map((c) => c.name).join(", ")}`,
    });
  }

  return results;
}

module.exports = { isConditionMet, validateConditions };
