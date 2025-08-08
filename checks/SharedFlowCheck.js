export const id = 'sharedflow-check';
export const description = 'Verify required policies/sharedflows are used in configured flows';

export function run(endpointXmls, config) {
  const violations = [];

  for (const rule of config.flowChecks || []) {
    let found = false;
    const { name, endpoint, flow, direction, description, type } = rule;
    const xmls = endpointXmls[endpoint] || [];

    for (const xml of xmls) {
      const container = xml[endpoint];
      const steps = getSteps(container, flow, direction);
      if (steps.includes(name)) {
        found = true;
        break;
      }
    }

    if (!found) {
      violations.push({
        name,
        type,
        description: description || `Missing ${type} '${name}' in ${endpoint}.${flow}.${direction}`
      });
    }
  }

  return {
    id,
    description,
    passed: violations.length === 0,
    violations
  };
}

function getSteps(container, flow, direction) {
  if (!container) return [];
  const flowSection = container[flow];
  if (!flowSection) return [];
  const steps = flowSection[direction]?.Step;
  if (!steps) return [];
  return Array.isArray(steps) ? steps.map(s => s.Name) : [steps.Name];
}