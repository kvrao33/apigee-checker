const { extractSteps } = require("../../src/services/validateAllFlows");

const endpointConfig = {
  ProxyEndpoint: {
    $: { name: "default" },
    PreFlow: {
      $: { name: "PreFlow" },
      Request: {
        Step: [
          { Name: "FC-verifyjwt" },
          { Name: "AM-removeHeader" },
          { Name: "KVM-Customer-Fetch" },
          { Name: "BA-AccessToken" },
          { Name: "SC-accessToken" },
          { Name: "JS-extractToken" },
          { Name: "JS-SetHashInput" }
        ]
      },
      Response: ""
    },
    Flows: {
      Flow: [
        {
          $: { name: "FetchCustomerInformation" },
          Request: {
            Step: [
              { Name: "JS-FetchCustomerRequestValidation" },
              { Name: "RF-BadRequest", Condition: "isError=true" }
            ]
          },
          Response: "",
        },
        {
          $: { name: "generateOTP" },
          Request: "",
          Response: "",
        },
        {
          $: { name: "validateOTP" },
          Request: "",
          Response: "",
        },
        {
          $: { name: "generateOTPV2" },
          Request: {
            Step: [
              { Name: "Java-MessageHash" },
              { Name: "JS-SetGenOtpRequest" }
            ]
          },
          Response: "",
        },
        {
          $: { name: "validateOTPV2" },
          Request: {
            Step: [
              { Name: "Java-MessageHash" },
              { Name: "JS-setValidateOtpRequest" }
            ]
          },
          Response: "",
        },
      ]
    },
    PostFlow: {
      $: { name: "PostFlow" },
      Request: {
        Step: { Condition: " proxy.pathsuffix != \"/fetchCustomerComposite\"", Name: "Java-HDFC-Bank-Encryption" }
      },
      Response: {
        Step: { Condition: "response.status.code==200 and proxy.pathsuffix != \"/fetchCustomerComposite\"", Name: "Java-HDFC-Bank-Decypt" }
      }
    },
    PostClientFlow: {
      Response: { Step: { Name: "FC-messagelogging" } }
    }
  }
};

describe("extractSteps function", () => {
  test("PreFlow Request returns array of steps", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "PreFlow", "Request");
    expect(steps).toHaveLength(7);
    expect(steps[0].Name).toBe("FC-verifyjwt");
  });

  test("PreFlow Response returns empty array when Step is empty string", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "PreFlow", "Response");
    expect(steps).toEqual([]);
  });

  test("PostFlow Request returns single object wrapped in array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "PostFlow", "Request");
    expect(steps).toHaveLength(1);
    expect(steps[0].Name).toBe("Java-HDFC-Bank-Encryption");
  });

  test("PostFlow Response returns single object wrapped in array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "PostFlow", "Response");
    expect(steps).toHaveLength(1);
    expect(steps[0].Name).toBe("Java-HDFC-Bank-Decypt");
  });

  test("PostClientFlow Response returns single object wrapped in array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "PostClientFlow", "Response");
    expect(steps).toHaveLength(1);
    expect(steps[0].Name).toBe("FC-messagelogging");
  });

  test("ConditionalFlow existing returns correct steps", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "ConditionalFlow", "Request", "FetchCustomerInformation");
    expect(steps).toHaveLength(2);
    expect(steps[0].Name).toBe("JS-FetchCustomerRequestValidation");
  });

  test("ConditionalFlow non-existing flow returns empty array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "ConditionalFlow", "Request", "NonExistingFlow");
    expect(steps).toEqual([]);
  });

  test("Flow exists but Step is empty string returns empty array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "ConditionalFlow", "Response", "FetchCustomerInformation");
    expect(steps).toEqual([]);
  });

  test("Non-existing flow returns empty array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "NonExistingFlow", "Request");
    expect(steps).toEqual([]);
  });

  test("ConditionalFlow without ConditionalFlowName returns empty array", () => {
    const steps = extractSteps(endpointConfig, "ProxyEndpoint", "ConditionalFlow", "Request");
    expect(steps).toEqual([]);
  });
});
