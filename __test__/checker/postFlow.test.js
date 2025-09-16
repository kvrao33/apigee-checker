const { validateFlow, validateAllFlows } = require('../../src/services/flowValidator');

describe('Flow Validator - PostFlow Tests', () => {
    const samplePolicies = [
        { name: 'AM-Response', type: 'AssignMessage' },
        { name: 'FC-Logging', type: 'FlowCallout' },
        { name: 'Cache-Response', type: 'ResponseCache' }
    ];

    const sampleRules = {
        flows: [
            {
                endpoint: 'ProxyEndpoint',
                flow: 'PostFlow',
                direction: 'Response',
                conditions: [
                    {
                        description: 'Response logging must be present',
                        name: 'FlowCallout',
                        type: 'Policy'
                    }
                ]
            },
            {
                endpoint: 'TargetEndpoint',
                flow: 'PostFlow',
                direction: 'Response',
                conditions: [
                    {
                        description: 'Response caching should be configured',
                        name: 'ResponseCache',
                        type: 'Policy'
                    }
                ]
            }
        ]
    };

    test('should validate proxy endpoint PostFlow with required logging', () => {
        const proxyEndpoint = {
            PostFlow: {
                Response: {
                    Step: [{ Name: 'FC-Logging' }]
                }
            }
        };

        const result = validateFlow(proxyEndpoint, 'PostFlow', 'ProxyEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            endpoint: 'ProxyEndpoint',
            flow: 'PostFlow',
            direction: 'Response',
            isSuccess: true,
            description: 'Response logging must be present'
        });
    });

    test('should validate target endpoint PostFlow with caching', () => {
        const targetEndpoint = {
            PostFlow: {
                Response: {
                    Step: [{ Name: 'Cache-Response' }]
                }
            }
        };

        const result = validateFlow(targetEndpoint, 'PostFlow', 'TargetEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            endpoint: 'TargetEndpoint',
            flow: 'PostFlow',
            direction: 'Response',
            isSuccess: true,
            description: 'Response caching should be configured'
        });
    });

    test('should fail validation when required policies are missing', () => {
        const proxyEndpoint = {
            PostFlow: {
                Response: {
                    Step: [{ Name: 'AM-Response' }] // Missing logging policy
                }
            }
        };

        const result = validateFlow(proxyEndpoint, 'PostFlow', 'ProxyEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            endpoint: 'ProxyEndpoint',
            flow: 'PostFlow',
            direction: 'Response',
            isSuccess: false,
            description: 'Response logging must be present',
            error: "Required policy 'FlowCallout' is not present"
        });
    });

    test('should validate all PostFlows together', () => {
        const testConfig = {
            proxies: [{
                ProxyEndpoint: {
                    PostFlow: {
                        Response: {
                            Step: [{ Name: 'FC-Logging' }]
                        }
                    }
                }
            }],
            targets: [{
                TargetEndpoint: {
                    PostFlow: {
                        Response: {
                            Step: [{ Name: 'Cache-Response' }]
                        }
                    }
                }
            }]
        };

        const result = validateAllFlows(testConfig, samplePolicies, sampleRules);

        expect(result).toHaveLength(2); // One for proxy, one for target
        
        // Check proxy PostFlow
        const proxyResult = result.find(r => r.endpoint === 'ProxyEndpoint' && r.flow === 'PostFlow');
        expect(proxyResult).toMatchObject({
            direction: 'Response',
            isSuccess: true,
            description: 'Response logging must be present'
        });

        // Check target PostFlow
        const targetResult = result.find(r => r.endpoint === 'TargetEndpoint' && r.flow === 'PostFlow');
        expect(targetResult).toMatchObject({
            direction: 'Response',
            isSuccess: true,
            description: 'Response caching should be configured'
        });
    });
});