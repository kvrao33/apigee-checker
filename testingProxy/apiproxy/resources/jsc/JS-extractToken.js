// Parse the response content as JSON
var Payload = JSON.parse(context.getVariable("calloutResponse.content"));

// Ensure the access token is properly extracted
var accessToken = Payload.access_token || "";
context.setVariable("accessToken", accessToken);

// Function to generate a unique 16-digit alphanumeric value
function generateUnique16DigitAlphanumeric() {
    var dt = new Date().getTime();
    var alphanumeric = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        var r = (dt + Math.random() * 36) % 36 | 0;
        dt = Math.floor(dt / 36);
        return r.toString(36); // Convert to base 36 to include numbers and letters
    });
    return alphanumeric;
}

// Generate the unique value
var uniqueValue = generateUnique16DigitAlphanumeric();
context.setVariable("uniqueValue", uniqueValue);

// Construct the request object
var request = {
    "RequestSignatureEncryptedValue": "",
    "SymmetricKeyEncryptedValue": "",
    "Scope": "HDFC_ERGO",
    "TransactionId": uniqueValue,
    "OAuthTokenValue": accessToken
};

// Set the request content as a context variable
// context.setVariable("request.content", JSON.stringify(request));
