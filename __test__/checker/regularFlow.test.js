const { validateRegularFlow } = require('../../src/services/flowValidator');

describe('Regular Flow Validator Tests', () => {
    const samplePolicies = [
        { name: 'VA-VerifyKey', type: 'VerifyAPIKey' },
        { name: 'OAuth2', type: 'OAuthV2' },
        { name: 'SpikeArrest-1', type: 'SpikeArrest' },
        { name: 'Quota-1', type: 'Quota' },
        { name: 'JWT-1', type: 'JWT' }
    ];

    const sampleRules = {
        flows: [
            {
                endpoint: 'ProxyEndpoint',
                flow: 'PreFlow',
                direction: 'Request',
                conditions: [
                    {
                        description: 'Auth check',
                        anyOf: [
                            { name: 'VerifyAPIKey', type: 'Policy' },
                            { name: 'OAuthV2', type: 'Policy' }
                        ]
                    }
                ]
            },
            {
                endpoint: 'ProxyEndpoint',
                flow: 'PreFlow',
                direction: 'Response',
                conditions: [
                    {
                        description: 'JWT check',
                        name: 'JWT',
                        type: 'Policy'
                    }
                ]
            }
        ]
    };

    test('should validate PreFlow with valid policies', () => {
        const proxyEndpoint = {
            PreFlow: {
                Request: {
                    Step: [
                        { Name: 'VA-VerifyKey' }
                    ]
                },
                Response: {
                    Step: [
                        { Name: 'JWT-1' }
                    ]
                }
            }
        };

        const result = validateRegularFlow(proxyEndpoint, 'PreFlow', 'ProxyEndpoint', samplePolicies, sampleRules);
         
        expect(result).toHaveLength(2); // One for request, one for response
        // Check request validation
        expect(result[0].endpoint).toBe('ProxyEndpoint');
        expect(result[0].flow).toBe('PreFlow');
        expect(result[0].direction).toBe('Request');
        expect(result[0].isSuccess).toBe(true);
        
        // Check response validation
        expect(result[1].endpoint).toBe('ProxyEndpoint');
        expect(result[1].flow).toBe('PreFlow');
        expect(result[1].direction).toBe('Response');
        expect(result[1].isSuccess).toBe(true);
    });

    test('should fail validation when policies are missing', () => {
        const proxyEndpoint = {
            PreFlow: {
                Request: {
                    Step: []
                },
                Response: {
                    Step: []
                }
            }
        };

        const result = validateRegularFlow(proxyEndpoint, 'PreFlow', 'ProxyEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(2);
        
        // Check request validation failure
        expect(result[0].endpoint).toBe('ProxyEndpoint');
        expect(result[0].flow).toBe('PreFlow');
        expect(result[0].direction).toBe('Request');
        expect(result[0].isSuccess).toBe(false);
        expect(result[0].error).toBe('None of the required authentication methods are present');
        
        // Check response validation failure
        expect(result[1].endpoint).toBe('ProxyEndpoint');
        expect(result[1].flow).toBe('PreFlow');
        expect(result[1].direction).toBe('Response');
        expect(result[1].isSuccess).toBe(false);
        expect(result[1].error).toBe("Required policy 'JWT' is not present");
    });

    test('should handle null/undefined endpoint', () => {
        const result = validateRegularFlow(null, 'PreFlow', 'ProxyEndpoint', samplePolicies, sampleRules);

        expect(result).toHaveLength(2);
        // Should still validate and fail
        expect(result[0].isSuccess).toBe(false);
        expect(result[1].isSuccess).toBe(false);
    });

    test('should handle PostFlow validation', () => {
        const postFlowRules = {
            flows: [
                {
                    endpoint: 'ProxyEndpoint',
                    flow: 'PostFlow',
                    direction: 'Response',
                    conditions: [
                        {
                            description: 'OAuth check',
                            name: 'OAuthV2',
                            type: 'Policy'
                        }
                    ]
                }
            ]
        };

        const proxyEndpoint = {
            PostFlow: {
                Response: {
                    Step: [
                        { Name: 'OAuth2' }
                    ]
                }
            }
        };

        const result = validateRegularFlow(proxyEndpoint, 'PostFlow', 'ProxyEndpoint', samplePolicies, postFlowRules);
        expect(result).toHaveLength(1);
        expect(result[0].endpoint).toBe('ProxyEndpoint');
        expect(result[0].flow).toBe('PostFlow');
        expect(result[0].direction).toBe('Response');
        expect(result[0].isSuccess).toBe(true);
    });
});