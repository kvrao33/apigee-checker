const { extractedAPIProxyData } = require("./src/loader/extractedProxyFromXML");
const { validateAllFlows } = require("./src/services/flowValidator");

// Option 1: Using async IIFE
(async () => {
  const result = await extractedAPIProxyData("/home/niveus/Apigee/apigee-checker/testingProxy/apiproxy");
  let data =validateAllFlows(result,result.policies,require('./config/default.json'));
  console.log(data);
  
})();
