const { extractedAPIProxyData } = require("./src/loader/extractedProxyFromXML");

// Option 1: Using async IIFE
(async () => {
  const result = await extractedAPIProxyData("/home/niveus/Apigee/apigee-checker/testingProxy/apiproxy");
  console.log(result);
})();

// OR Option 2: Using Promise chain
extractedAPIProxyData("/home/niveus/Apigee/apigee-checker/testingProxy/apiproxy")
  .then(result => console.log(JSON.stringify(result)))
  .catch(error => console.error(error));