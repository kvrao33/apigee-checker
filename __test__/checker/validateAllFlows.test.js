const { validateAllFlows } = require('../../src/services/flowValidator');

describe('ValidateAllFlows Tests', () => {
    const samplePolicies = [
        { name: 'FC-verifyjwt', type: 'FlowCallout' },
        { name: 'AM-removeHeader', type: 'AssignMessage' },
        { name: 'KVM-Customer-Fetch', type: 'KeyValueMapOperations' },
        { name: 'BA-AccessToken', type: 'BasicAuthentication' },
        { name: 'AM-setHeader', type: 'AssignMessage' },
        { name: 'JS-setDynamicPath', type: 'Javascript' }
    ];

    const sampleRules = {
        flows: [
            {
                endpoint: 'ProxyEndpoint',
                flow: 'PreFlow',
                direction: 'Request',
                conditions: [{
                    description: 'Authentication check must be present',
                    anyOf: [
                        { name: 'FC-verifyjwt', type: 'FlowCallout' },
                        { name: 'BA-AccessToken', type: 'BasicAuthentication' }
                    ]
                }]
            },
            {
                endpoint: 'TargetEndpoint',
                flow: 'PreFlow',
                direction: 'Request',
                conditions: [{
                    description: 'Target setup must be present',
                    allOf: [
                        { name: 'AM-setHeader', type: 'AssignMessage' },
                        { name: 'JS-setDynamicPath', type: 'Javascript' }
                    ]
                }]
            }
        ]
    };

    test('should validate all flows from test.json structure', () => {
        const testConfig = {
            proxies: [{
                ProxyEndpoint: {
                    PreFlow: {
                        Request: {
                            Step: [
                                { Name: 'FC-verifyjwt' },
                                { Name: 'AM-removeHeader' },
                                { Name: 'KVM-Customer-Fetch' }
                            ]
                        }
                    },
                    PostFlow: {
                        Response: {
                            Step: []
                        }
                    }
                }
            }],
            targets: [{
                TargetEndpoint: {
                    PreFlow: {
                        Request: {
                            Step: [
                                { Name: 'AM-setHeader' },
                                { Name: 'JS-setDynamicPath' }
                            ]
                        }
                    },
                    PostFlow: {
                        Response: {
                            Step: []
                        }
                    }
                }
            }]
        };

        const results = validateAllFlows(testConfig, samplePolicies, sampleRules);
console.log(results);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        // Check proxy endpoint validation
        const proxyPreFlowResult = results.find(r => 
            r.endpoint === 'ProxyEndpoint' && 
            r.flow === 'PreFlow' &&
            r.direction === 'Request'
        );
        expect(proxyPreFlowResult).toBeTruthy();
        expect(proxyPreFlowResult.isSuccess).toBe(true);
        expect(proxyPreFlowResult.description).toBe('Authentication check must be present');

        // Check target endpoint validation
        const targetPreFlowResult = results.find(r => 
            r.endpoint === 'TargetEndpoint' && 
            r.flow === 'PreFlow' &&
            r.direction === 'Request'
        );
        expect(targetPreFlowResult).toBeTruthy();
        expect(targetPreFlowResult.isSuccess).toBe(true);
        expect(targetPreFlowResult.description).toBe('Target setup must be present');
    });

    test('should handle missing proxy or target endpoints', () => {
        const emptyConfig = {
            proxies: [],
            targets: []
        };

        const results = validateAllFlows(emptyConfig, samplePolicies, sampleRules);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
    });

    test('should handle missing steps in flows', () => {
        const configWithEmptySteps = {
            proxies: [{
                ProxyEndpoint: {
                    PreFlow: {
                        Request: {
                            Step: []
                        }
                    }
                }
            }]
        };

        const results = validateAllFlows(configWithEmptySteps, samplePolicies, sampleRules);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        const proxyPreFlowResult = results.find(r => 
            r.endpoint === 'ProxyEndpoint' && 
            r.flow === 'PreFlow' &&
            r.direction === 'Request'
        );
        expect(proxyPreFlowResult).toBeTruthy();
        expect(proxyPreFlowResult.isSuccess).toBe(false);
        expect(proxyPreFlowResult.error).toBe("None of the required authentication methods are present");
    });
});