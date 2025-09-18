const { isConditionMet , validateConditions} = require("../../src/services/checker");

describe("validateConditions function", () => {
  const steps = [{ Name: "AuthPolicy" }, { Name: "RateLimit" }];
  const policies = [
    { name: "AuthPolicy", type: "OAuth" },
    { name: "RateLimit", type: "SpikeArrest" },
    { name: "SharedFlowStep", SharedFlowBundle: "CommonFlow" },
  ];

  test("handles anyOf condition - success", () => {
    const conditions = [
      {
        description: "At least one auth method must exist",
        anyOf: [
          { type: "Policy", name: "OAuth" },
          { type: "Policy", name: "InvalidType" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);
    expect(results[0].success).toBe(true);
    expect(results[0].metConditions).toHaveLength(1);
    expect(results[0].notMetConditions).toHaveLength(1);
    expect(results[0].message).toBe("Conditions met: OAuth");
  });

  test("handles anyOf condition - failure", () => {
    const conditions = [
      {
        description: "At least one JWT or APIKey must exist",
        anyOf: [
          { type: "Policy", name: "JWT" },
          { type: "Policy", name: "APIKey" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);
    expect(results[0].success).toBe(false);
    expect(results[0].metConditions).toHaveLength(0);
    expect(results[0].notMetConditions).toHaveLength(2);
    expect(results[0].message).toBe("Conditions not met: JWT, APIKey");
  });

  test("handles allOf condition - success", () => {
    const conditions = [
      {
        description: "OAuth and SpikeArrest must be present",
        allOf: [
          { type: "Policy", name: "OAuth" },
          { type: "Policy", name: "SpikeArrest" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);
    expect(results[0].success).toBe(true);
    expect(results[0].metConditions.map((c) => c.name)).toEqual([
      "OAuth",
      "SpikeArrest",
    ]);
    expect(results[0].message).toBe("Conditions met: OAuth, SpikeArrest");
  });

  test("handles allOf condition - failure", () => {
    const conditions = [
      {
        description: "OAuth and APIKey must be present",
        allOf: [
          { type: "Policy", name: "OAuth" },
          { type: "Policy", name: "APIKey" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);
    expect(results[0].success).toBe(false);
    expect(results[0].metConditions.map((c) => c.name)).toEqual(["OAuth"]);
    expect(results[0].notMetConditions.map((c) => c.name)).toEqual(["APIKey"]);
    expect(results[0].message).toBe("Conditions not met: APIKey");
  });

  test("handles single condition - success", () => {
    const conditions = [
      {
        description: "OAuth policy must exist",
        type: "Policy",
        name: "OAuth",
      },
    ];

    const results = validateConditions(steps, policies, conditions);
    expect(results[0].success).toBe(true);
    expect(results[0].metConditions.map((c) => c.name)).toEqual(["OAuth"]);
    expect(results[0].message).toBe("Conditions met: OAuth");
  });

  test("handles single condition - failure", () => {
    const conditions = [
      {
        description: "APIKey policy must exist",
        type: "Policy",
        name: "APIKey",
      },
    ];

    const results = validateConditions(steps, policies, conditions);
    expect(results[0].success).toBe(false);
    expect(results[0].notMetConditions.map((c) => c.name)).toEqual(["APIKey"]);
    expect(results[0].message).toBe("Conditions not met: APIKey");
  });

    test("handles multiple mixed conditions - some success, some failure", () => {
    const conditions = [
      {
        description: "OAuth policy must exist",
        type: "Policy",
        name: "OAuth",
      },
      {
        description: "APIKey policy must exist",
        type: "Policy",
        name: "APIKey",
      },
      {
        description: "At least one auth method must exist",
        anyOf: [
          { type: "Policy", name: "OAuth" },
          { type: "Policy", name: "JWT" },
        ],
      },
      {
        description: "OAuth and SpikeArrest must be present",
        allOf: [
          { type: "Policy", name: "OAuth" },
          { type: "Policy", name: "SpikeArrest" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);

    // Condition 1 - OAuth present
    expect(results[0].success).toBe(true);
    expect(results[0].message).toBe("Conditions met: OAuth");

    // Condition 2 - APIKey missing
    expect(results[1].success).toBe(false);
    expect(results[1].message).toBe("Conditions not met: APIKey");

    // Condition 3 - anyOf success (OAuth exists)
    expect(results[2].success).toBe(true);
    expect(results[2].message).toBe("Conditions met: OAuth");

    // Condition 4 - allOf success (OAuth + SpikeArrest exist)
    expect(results[3].success).toBe(true);
    expect(results[3].message).toBe("Conditions met: OAuth, SpikeArrest");
  });

  test("handles multiple allOf and anyOf conditions - all fail", () => {
    const conditions = [
      {
        description: "JWT and APIKey must be present",
        allOf: [
          { type: "Policy", name: "JWT" },
          { type: "Policy", name: "APIKey" },
        ],
      },
      {
        description: "At least one of InvalidType or NonExistent must exist",
        anyOf: [
          { type: "Policy", name: "InvalidType" },
          { type: "Policy", name: "NonExistent" },
        ],
      },
    ];

    const results = validateConditions(steps, policies, conditions);


    // Condition 1 - allOf failure
    expect(results[0].success).toBe(false);
    expect(results[0].notMetConditions.map((c) => c.name)).toEqual(["JWT", "APIKey"]);
    expect(results[0].message).toBe("Conditions not met: JWT, APIKey");

    // Condition 2 - anyOf failure
    expect(results[1].success).toBe(false);
    expect(results[1].notMetConditions.map((c) => c.name)).toEqual(["InvalidType", "NonExistent"]);
    expect(results[1].message).toBe("Conditions not met: InvalidType, NonExistent");
  });

  test("handles empty conditions array", () => {
    const conditions = [];

    const results = validateConditions(steps, policies, conditions);

    expect(results).toEqual([]);
  });

});

