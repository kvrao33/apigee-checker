const { validateConditions } = require("../../src/services/checker");

describe("validateConditions with full policy set", () => {
  // Steps are references to policies by Name
  const steps = [
    { Name: "AM-setHeader" },
    { Name: "BA-AccessToken" },
    { Name: "EV-getPhoneNo" },
    { Name: "FC-verifyjwt" },
    { Name: "JS-extractToken" },
    { Name: "Java-HDFC-Bank-Encryption" },
    { Name: "KVM-Customer-Fetch" },
    { Name: "RF-BadRequest" },
    { Name: "SC-GenerateOTP" },
  ];

  const policies = [
    {
      type: "AssignMessage",
      name: "AM-removeHeader",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "AssignMessage",
      name: "AM-setGenOtpHashInput",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "AssignMessage",
      name: "AM-setHeader",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "BasicAuthentication",
      name: "BA-AccessToken",
      enabled: "false",
      continueOnError: "false",
    },
    {
      type: "ExtractVariables",
      name: "EV-getPhoneNo",
      enabled: "true",
      continueOnError: "true",
    },
    {
      type: "ExtractVariables",
      name: "Extract-Variables-1",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "ExtractVariables",
      name: "Extract-Variables-2",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "FlowCallout",
      name: "FC-messagelogging",
      enabled: "true",
      continueOnError: "false",
      SharedFlowBundle: "SF-MessageLogging-nonprod",
    },
    {
      type: "FlowCallout",
      name: "FC-verifyjwt",
      enabled: "true",
      continueOnError: "false",
      SharedFlowBundle: "OAuthJWTTokenVerification",
    },
    {
      type: "Javascript",
      name: "JS-FetchCustomerRequestValidation",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "Javascript",
      name: "JS-SetGenOtpRequest",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "Javascript",
      name: "JS-SetHashInput",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "Javascript",
      name: "JS-extractToken",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "Javascript",
      name: "JS-setDynamicPath",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "Javascript",
      name: "JS-setValidateOtpRequest",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "JavaCallout",
      name: "Java-HDFC-Bank-Decypt",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "JavaCallout",
      name: "Java-HDFC-Bank-Encryption",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "JavaCallout",
      name: "Java-MessageHash",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "KeyValueMapOperations",
      name: "KVM-Customer-Fetch",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "RaiseFault",
      name: "RF-BadRequest",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "RaiseFault",
      name: "RF-sendResponse",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "ServiceCallout",
      name: "SC-Fetch_CustomerInformation",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "ServiceCallout",
      name: "SC-GenerateOTP",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "ServiceCallout",
      name: "SC-VerifyOTP",
      enabled: "true",
      continueOnError: "false",
    },
    {
      type: "ServiceCallout",
      name: "SC-accessToken",
      enabled: "true",
      continueOnError: "false",
    },
  ];

  test("validates Policy type correctly", () => {
    const conditions = [
      {
        description: "Must have AssignMessage policy",
        type: "Policy",
        name: "AssignMessage",
      },
    ];

    const results = validateConditions(steps, policies, conditions);

    expect(results[0].success).toBe(true);
    expect(results[0].metConditions.map((c) => c.name)).toEqual([
      "AssignMessage",
    ]);
    expect(results[0].message).toBe("Conditions met: AssignMessage");
  });

  test("validates SharedFlow type correctly", () => {
    const conditions = [
      {
        description: "Must call OAuth shared flow",
        type: "SharedFlow",
        name: "OAuthJWTTokenVerification",
      },
    ];

    const results = validateConditions(steps, policies, conditions);

    expect(results[0].success).toBe(true);
    expect(results[0].metConditions.map((c) => c.name)).toEqual([
      "OAuthJWTTokenVerification",
    ]);
    expect(results[0].message).toBe(
      "Conditions met: OAuthJWTTokenVerification"
    );
  });

  test("anyOf with Policy + SharedFlow - success", () => {
    const conditions = [
      {
        description: "Must have either KVM or Logging flow",
        anyOf: [
          { type: "Policy", name: "KeyValueMapOperations" },
          { type: "SharedFlow", name: "SF-MessageLogging-nonprod" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);

    expect(results[0].success).toBe(true);
    expect(results[0].metConditions.map((c) => c.name)).toEqual([
      "KeyValueMapOperations",
    ]);
    expect(results[0].notMetConditions.map((c) => c.name)).toEqual([
      "SF-MessageLogging-nonprod",
    ]);
  });

  test("allOf with multiple Policy types - failure", () => {
    const conditions = [
      {
        description: "Must have BasicAuthentication and ServiceCallout",
        allOf: [
          { type: "Policy", name: "BasicAuthentication" },
          { type: "Policy", name: "NonExistentPolicy" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);

    expect(results[0].success).toBe(false);
    expect(results[0].metConditions.map((c) => c.name)).toEqual([
      "BasicAuthentication",
    ]);
    expect(results[0].notMetConditions.map((c) => c.name)).toEqual([
      "NonExistentPolicy",
    ]);
    expect(results[0].message).toBe(
      "Conditions not met: NonExistentPolicy"
    );
  });

  test("handles empty conditions", () => {
    const results = validateConditions(steps, policies, []);
    expect(results).toEqual([]);
  });
});
