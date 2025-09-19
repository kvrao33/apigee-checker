const { extractedAPIProxyData } = require('./src/loader/extractedProxyFromXML');
const { printValidationResultTable } = require('./src/services/table');
const { validateAllFlows } = require('./src/services/validateAllFlows');


// Option 1: Using async IIFE
(async () => {
  const result = await extractedAPIProxyData("/home/niveus/Apigee/apigee-checker/testingProxy/apiproxy");
  const data = require('./config/default.json')
  let data1 =validateAllFlows(result,data);
  printValidationResultTable(data1)
  
  
})();
