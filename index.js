// === index.js ===
import { runAssessment } from './core/runner.js';
import defaultRules from './config/defaultRules.json';
import fs from 'fs-extra';

/**
 * Runs the Apigee X proxy assessment.
 * @param {string} bundlePath - Path to the extracted Apigee proxy bundle.
 * @param {object} [customConfig] - Optional custom configuration for checks. If not provided, defaultRules.json will be used.
 * @returns {Promise<Array>} A promise that resolves with the assessment report.
 */
export async function assessApigeeProxy(bundlePath, customConfig) {
  const config = customConfig || defaultRules;
  return runAssessment(bundlePath, config);
}

// Example of how to use it (optional - for testing purposes)
// (async () => {
//   const bundlePath = './path/to/your/apiproxy/bundle'; // Replace with an actual path for testing
//   try {
//     const report = await assessApigeeProxy(bundlePath);
//     console.log('Programmatic assessment complete:');
//     console.log(JSON.stringify(report, null, 2));
//     // You could also write this to a file
//     // fs.writeFileSync('./programmatic_report.json', JSON.stringify(report, null, 2));
//   } catch (error) {
//     console.error('Error during programmatic assessment:', error);
//   }
// })();