import { convertedXMLtoJson } from "./xmltojsonconverter.js";
import path from "path";

const extractData = async (folderPath, subFolder, transformFn = (data) => data) => {
  try {
    const jsonDataArray = await convertedXMLtoJson(path.join(folderPath, subFolder));
    return { [subFolder]: transformFn(jsonDataArray) };
  } catch (error) {
    console.error(`Error extracting ${subFolder}:`, error.message);
    return { [subFolder]: [] };
  }
};

// transform policies specifically
const transformPolicies = (jsonDataArray) =>
  jsonDataArray.map((jsonData) => {
    const rootTag = Object.keys(jsonData)[0];
    const rootAttributes = jsonData[rootTag]["$"] || {};
    return {
      type: rootTag,
      name: rootAttributes.name || "",
      enabled: rootAttributes.enabled || "",
      continueOnError: rootAttributes.continueOnError || "",
      ...(rootTag === "FlowCallout"
        ? { SharedFlowBundle: jsonData[rootTag]?.SharedFlowBundle || "" }
        : {}),
    };
  });

// main extractor
const extractedAPIProxyData = async (folderPath) => {
  const { policies } = await extractData(folderPath, "policies", transformPolicies);
  const { proxies } = await extractData(folderPath, "proxies");
  const { targets } = await extractData(folderPath, "targets");

  return { policies, proxies, targets };
};

const folderPath = process.argv[2] || "/home/niveus/DileepKumar/ApigeeTool/apiproxy";

const extracteddata = await extractedAPIProxyData(folderPath);
console.log("extracteddata:", JSON.stringify(extracteddata, null, 2));
