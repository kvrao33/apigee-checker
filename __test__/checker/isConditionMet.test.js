const { isConditionMet } = require("../../src/services/checker");

describe("isConditionMet function", () => {
  const steps = [
    { Name: "FC-verifyjwt" },
    { Name: "FC-removeHeader2" },
    { Name: "KVM-Customer-Fetch" },
    { Name: "BA-AccessToken" },
    { Name: "SC-accessToken" },
    { Name: "JS-extractToken" },
    { Name: "JS-SetHashInput" }
  ];

  const policies = [
    {
      type: "AssignMessage",
      name: "AM-removeHeader",
      enabled: true,
      continueOnError: true
    },
    {
      type: "FlowCallout",
      name: "FC-removeHeader2",
      enabled: true,
      SharedFlowBundle: "access-auth-sharedflow"
    }
  ];

  it("should return true for SharedFlow condition that exists", () => {
    const condition = { name: "access-auth-sharedflow", type: "SharedFlow" };
    expect(isConditionMet(steps, policies, condition)).toBe(true);
  });

  it("should return false for SharedFlow condition that does not exist", () => {
    const condition = { name: "non-existent-sharedflow", type: "SharedFlow" };
    expect(isConditionMet(steps, policies, condition)).toBe(false);
  });

  it("should return false for Policy condition that does not exist in steps", () => {
    const condition = { name: "AM-removeHeader", type: "Policy" };
    expect(isConditionMet(steps, policies, condition)).toBe(false);
  });

  it("should return false for Policy condition that does not exist in policies", () => {
    const condition = { name: "NonExistentPolicy", type: "Policy" };
    expect(isConditionMet(steps, policies, condition)).toBe(false);
  });

  it("should return false for Policy condition with mismatched type", () => {
    const condition = { name: "FC-removeHeader2", type: "Policy" };
    expect(isConditionMet(steps, policies, condition)).toBe(false);
  });

  it("should return false for Policy condition with correct name in steps but not in policies", () => {
    const condition = { name: "FC-verifyjwt", type: "Policy" };
    expect(isConditionMet(steps, policies, condition)).toBe(false);
  });

  it("should return true for SharedFlow when FlowCallout policy and step match", () => {
    const condition = { name: "access-auth-sharedflow", type: "SharedFlow" };
    expect(isConditionMet(steps, policies, condition)).toBe(true);
  });
});
