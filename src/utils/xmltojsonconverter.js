const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const convertedXMLtoJson = async (dirPath, parserOptions = { explicitArray: false }) => {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      console.error(`Directory does not exist: ${dirPath}`);
      return [];
    }

    const parser = new xml2js.Parser(parserOptions); 
    const files = await fs.promises.readdir(dirPath);
    const xmlFiles = files.filter((file) => file.endsWith(".xml"));

    if (xmlFiles.length === 0) {
      console.error(`No XML files found in directory: ${dirPath}`);
      return [];
    }
    
    const convertedData = await Promise.all(
      xmlFiles.map(async (file) => {
        try {
          const filePath = path.join(dirPath, file);
          const xmlContent = await fs.promises.readFile(filePath, "utf-8");
          const result = await parser.parseStringPromise(xmlContent);
          return result;
        } catch (error) {
          console.error(`Error parsing ${file}:`, error.message);
          return null;
        }
      })
    );

    // Filter out any failed conversions
    return convertedData.filter(data => data !== null);
  } catch (err) {
    console.error("Error in XML conversion:", err.message);
    return [];
  }
};

module.exports = { convertedXMLtoJson };