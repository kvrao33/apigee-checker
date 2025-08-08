// === lib/xmlUtils.js ===
import fs from 'fs-extra';
import { XMLParser } from 'fast-xml-parser';
import path from 'path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true
});

export function readXML(filePath) {
  const xmlData = fs.readFileSync(filePath, 'utf8');
  return parser.parse(xmlData);
}

export function listXMLFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }
  return fs.readdirSync(directoryPath).filter(file => file.endsWith('.xml'));
}