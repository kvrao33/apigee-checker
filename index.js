const { downloadProxyBundle } = require("./src/services/downloader");

//index.js


(async () => {
  try {
    const result = await downloadProxyBundle({
      proxyName: "testingProxy",
      org: "niveus",
      env: "test",
      token: "ya29"
    });
    
    if (result === null) {
      process.exit(1); // Exit with error code
    }
    
    console.log("Successfully downloaded proxy bundle:", result);
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
})();
