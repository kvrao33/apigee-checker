// === myApp.js ===
import { assessApigeeProxy } from './index.js'; // Adjust path if needed
import fs from 'fs-extra';

async function performApigeeCheck() {
  const proxyBundlePath = './path/to/your/apigee-proxy-bundle'; // <--- IMPORTANT: Change this to your actual proxy bundle path

  // Option 1: Use default rules
  try {
    console.log('Running Apigee proxy assessment with default rules...');
    const reportDefault = await assessApigeeProxy(proxyBundlePath);
    console.log('Assessment with default rules complete. Report:');
    console.log(JSON.stringify(reportDefault, null, 2));
    fs.writeFileSync('./myApp_default_report.json', JSON.stringify(reportDefault, null, 2));
    console.log('Report saved to myApp_default_report.json');
  } catch (error) {
    console.error('Error during default rules assessment:', error);
  }

  // Option 2: Use custom rules
  const customConfig = {
    flowChecks: [
      {
        "name": "SpikeArrest",
        "type": "Policy",
        "endpoint": "ProxyEndpoint",
        "flow": "PreFlow",
        "direction": "Request",
        "description": "SpikeArrest should be attached to ProxyEndpoint PreFlow request"
      }
    ]
  };

  try {
    console.log('\nRunning Apigee proxy assessment with custom rules...');
    const reportCustom = await assessApigeeProxy(proxyBundlePath, customConfig);
    console.log('Assessment with custom rules complete. Report:');
    console.log(JSON.stringify(reportCustom, null, 2));
    fs.writeFileSync('./myApp_custom_report.json', JSON.stringify(reportCustom, null, 2));
    console.log('Report saved to myApp_custom_report.json');
  } catch (error) {
    console.error('Error during custom rules assessment:', error);
  }
}

performApigeeCheck();