const { validateFlow, validateAllFlows } = require('../../src/services/flowValidator');

describe('Flow Validator - PreFlow Tests', () => {
    // Sample test data
    const samplePolicies = [
        { name: 'VA-VerifyKey', type: 'VerifyAPIKey' },
        { name: 'OAuth2', type: 'OAuthV2' },
        { name: 'SpikeArrest-1', type: 'SpikeArrest' },
        { name: 'Quota-1', type: 'Quota' },
        { name: 'JWT-1', type: 'JWT' },
        { name: 'SF-Auth', type: 'SharedFlow', SharedFlowBundle: 'access-auth-sharedflow' }
    ];

    const sampleRules = {
        flows: [
            {
                endpoint: 'ProxyEndpoint',
                flow: 'PreFlow',
                direction: 'Request',
                conditions: [
                    {
                        description: 'Authentication check',
                        anyOf: [
                            { name: 'VerifyAPIKey', type: 'Policy' },
                            { name: 'OAuthV2', type: 'Policy' }
                        ]
                    },
                    
                ]
            },
            {
                endpoint: 'TargetEndpoint',
                flow: 'PreFlow',
                direction: 'Request',
                conditions: [
                    {
                        description: 'Target authentication',
                        name: 'OAuthV2',
                        type: 'Policy'
                    }
                ]
            }
        ]
    };

    test('should validate proxy endpoint PreFlow with valid policies', () => {
        const proxyEndpoint = {
            PreFlow: {
                Request: {
                    Step: [{ Name: 'VA-VerifyKey' }]
                }
            }
        };

        const result = validateFlow(proxyEndpoint, 'PreFlow', 'ProxyEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            endpoint: 'ProxyEndpoint',
            flow: 'PreFlow',
            direction: 'Request',
            isSuccess: true,
            description: 'Authentication check'
        });
    });

    test('should validate target endpoint PreFlow with missing policies', () => {
        const targetEndpoint = {
            PreFlow: {
                Request: {
                    Step: [{ Name: 'SpikeArrest-1' }] // Missing OAuth2
                }
            }
        };

        const result = validateFlow(targetEndpoint, 'PreFlow', 'TargetEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            endpoint: 'TargetEndpoint',
            flow: 'PreFlow',
            direction: 'Request',
            isSuccess: false,
            description: 'Target authentication',
            error: "Required policy 'OAuthV2' is not present"
        });
    });

    test('should validate all flows together', () => {
        const testConfig = {
            proxies: [{
                ProxyEndpoint: {
                    PreFlow: {
                        Request: {
                            Step: [{ Name: 'VA-VerifyKey' }]
                        }
                    }
                }
            }],
            targets: [{
                TargetEndpoint: {
                    PreFlow: {
                        Request: {
                            Step: [{ Name: 'OAuth2' }]
                        }
                    }
                }
            }]
        };

        const result = validateAllFlows(testConfig, samplePolicies, sampleRules);

        expect(result).toHaveLength(2); // One for proxy, one for target

        // Check proxy PreFlow
        const proxyResult = result.find(r => r.endpoint === 'ProxyEndpoint');
        expect(proxyResult).toMatchObject({
            flow: 'PreFlow',
            direction: 'Request',
            isSuccess: true,
            description: 'Authentication check'
        });

        // Check target PreFlow
        const targetResult = result.find(r => r.endpoint === 'TargetEndpoint');
        expect(targetResult).toMatchObject({
            flow: 'PreFlow',
            direction: 'Request',
            isSuccess: true,
            description: 'Target authentication'
        });
    });

    test('should handle null/undefined endpoints', () => {
        const result = validateAllFlows(null, samplePolicies, sampleRules);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);

        const emptyResult = validateAllFlows({ proxies: [], targets: [] }, samplePolicies, sampleRules);
        expect(Array.isArray(emptyResult)).toBe(true);
        expect(emptyResult).toHaveLength(0);
    });
});