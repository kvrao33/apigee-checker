const { validateConditions } = require('./checker');

/**
 * Validates a specific flow in an end    if (config.targets && Array.isArray(config.targets)) {
        config.targets.forEach(target => {
            if (target.TargetEndpoint) {
                results.push(
                    ...validateFlow(target.TargetEndpoint, 'PreFlow', 'TargetEndpoint', policies, rules),
                    ...validateFlow(target.TargetEndpoint, 'PostFlow', 'TargetEndpoint', policies, rules)
                );
            }
        });
    }
    
    return results;param {Object} endpoint - The endpoint configuration (proxy or target)
 * @param {string} flowType - Type of flow (PreFlow, PostFlow, ConditionalFlow)
 * @param {string} endpointType - Type of endpoint (ProxyEndpoint or TargetEndpoint)
 * @param {Array} policies - Array of policy objects
 * @param {Object} rules - Configuration rules
 * @returns {Array} Array of validation results
 */


/**
 * Validates a regular flow (PreFlow or PostFlow)
 */
function validateRegularFlow(endpoint, flowType, endpointType, policies, rules) {
    const results = [];

    // Helper function to get rules
    const getRules = (direction) => {
        return rules.flows.filter(r => 
            r.endpoint === endpointType && 
            r.flow === flowType &&
            r.direction === direction
        ).map(r => ({
            ...r,
            conditions: r.conditions || []
        }));
    };

    // Helper function to get steps
    const getSteps = (direction) => {
        const flow = endpoint?.[flowType]?.[direction];
        if (!flow || typeof flow !== 'object') {
            return [];
        }
        return flow.Step || [];
    };

    // Validate Request and Response flows
    ['Request', 'Response'].forEach(direction => {
        const directionRules = getRules(direction);
        directionRules.forEach(ruleSet => {
            const steps = getSteps(direction);
            const validationResult = validateConditions(steps, policies, ruleSet.conditions);
            validationResult.forEach(vResult => {
                const ruleResult = {
                    ...ruleSet.conditions[0],  // Include the rule conditions
                    endpoint: endpointType,
                    flow: flowType,
                    direction: direction,
                    description: vResult.description,
                    isSuccess: vResult.success,
                    error: vResult.error
                };
                results.push(ruleResult);
            });
        });
    });

    return results;
}

/**
 * Validates conditional flows
 */


function validateFlow(endpoint, flowType, endpointType, policies, rules) {
    return validateRegularFlow(endpoint, flowType, endpointType, policies, rules);
}

/**
 * Validates all flows in both proxy and target endpoints
 * @param {Object} config - Configuration object containing proxies and targets
 * @param {Array} policies - Array of policy objects
 * @param {Object} rules - Configuration rules
 * @returns {Array} Array of validation results
 */
function validateAllFlows(config, policies, rules) {
    const results = [];

    if (!config) {
        return [];
    }

    // Validate Proxy Endpoints
    if (config.proxies && Array.isArray(config.proxies)) {
        config.proxies.forEach(proxy => {
            if (proxy && proxy.ProxyEndpoint) {
                const proxyResults = [
                    ...(validateFlow(proxy.ProxyEndpoint, 'PreFlow', 'ProxyEndpoint', policies, rules) || []),
                    ...(validateFlow(proxy.ProxyEndpoint, 'PostFlow', 'ProxyEndpoint', policies, rules) || [])
                ];
                results.push(...proxyResults);
            }
        });
    }

    // Validate Target Endpoints
    if (config.targets && Array.isArray(config.targets)) {
        config.targets.forEach(target => {
            if (target && target.TargetEndpoint) {
                const targetResults = [
                    ...(validateFlow(target.TargetEndpoint, 'PreFlow', 'TargetEndpoint', policies, rules) || []),
                    ...(validateFlow(target.TargetEndpoint, 'PostFlow', 'TargetEndpoint', policies, rules) || [])
                ];
                results.push(...targetResults);
            }
        });
    }

    return results;
}

module.exports = { validateAllFlows, validateFlow , validateRegularFlow};