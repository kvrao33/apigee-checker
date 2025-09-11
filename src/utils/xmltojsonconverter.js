import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const xml2js = require("xml2js");

const parser = new xml2js.Parser({ explicitArray: false });

export const convertedXMLtoJson = async (dirPath, parserOptions = { explicitArray: false }) => {
  try {
    const parser = new xml2js.Parser(parserOptions); 
    const files = await fs.promises.readdir(dirPath);
    const xmlFiles = files.filter((file) => file.endsWith(".xml"));

    if (xmlFiles.length === 0) {
      console.warn("No XML files found in directory:", dirPath);
      return [];
    }

    const convertedData = await Promise.all(
      xmlFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const xmlContent = await fs.promises.readFile(filePath, "utf-8");
        return parser.parseStringPromise(xmlContent);
      })
    );

    return convertedData;
  } catch (err) {
    console.error("Error processing XML files:", err.message);
    throw err;
  }
};