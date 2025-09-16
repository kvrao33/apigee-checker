const path = require("path");
const {extractedAPIProxyData} = require("../../src/loader/extractedProxyFromXML.js");
const { convertedXMLtoJson } = require("../../src/utils/xmltojsonconverter.js");

jest.mock("../../src/utils/xmltojsonconverter", () => ({
  convertedXMLtoJson: jest.fn(),
}));

describe("extractedAPIProxyData", () => {
  const folderPath = "/fake/apiproxy";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should transform policies correctly", async () => {
    convertedXMLtoJson.mockImplementation(async (filePath) => {
      if (filePath.includes("policies")) {
        return [
          {
            AssignMessage: {
              $: { name: "AM-Test", enabled: "true", continueOnError: "false" },
            },
          },
          {
            FlowCallout: {
              $: { name: "FC-Test", enabled: "false" },
              SharedFlowBundle: "Shared-Flow-Name",
            },
          },
        ];
      }
      return [];
    });

    const result = await extractedAPIProxyData(folderPath);

    expect(convertedXMLtoJson).toHaveBeenCalledWith(
      path.join(folderPath, "policies")
    );
    expect(result.policies).toEqual([
      {
        type: "AssignMessage",
        name: "AM-Test",
        enabled: "true",
        continueOnError: "false",
      },
      {
        type: "FlowCallout",
        name: "FC-Test",
        enabled: "false",
        continueOnError: "",
        SharedFlowBundle: "Shared-Flow-Name",
      },
    ]);
  });

  it("should return proxies and targets without transformation", async () => {
    convertedXMLtoJson.mockImplementation(async (filePath) => {
      if (filePath.includes("proxies")) {
        return [{ ProxyEndpoint: { $: { name: "default" } } }];
      }
      if (filePath.includes("targets")) {
        return [{ TargetEndpoint: { $: { name: "defaultTarget" } } }];
      }
      return [];
    });

    const result = await extractedAPIProxyData(folderPath);

    expect(convertedXMLtoJson).toHaveBeenCalledWith(
      path.join(folderPath, "proxies")
    );
    expect(convertedXMLtoJson).toHaveBeenCalledWith(
      path.join(folderPath, "targets")
    );
    expect(result.proxies).toEqual([{ ProxyEndpoint: { $: { name: "default" } } }]);
    expect(result.targets).toEqual([{ TargetEndpoint: { $: { name: "defaultTarget" } } }]);
  });

  it("should handle errors gracefully and return empty arrays", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    convertedXMLtoJson.mockRejectedValue(new Error("Failed to parse"));

    const result = await extractedAPIProxyData("/fake/apiproxy");

    expect(result.policies).toEqual([]);
    expect(result.proxies).toEqual([]);
    expect(result.targets).toEqual([]);

    spy.mockRestore();
  });

});
