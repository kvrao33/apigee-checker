var request = JSON.parse(context.getVariable("request.content"));
var phoneNo = request.phoneNo;
var hashOutput = context.getVariable("hashOutput");
var instanceId = context.getVariable("instanceId");
var apiUser = context.getVariable("apiUser");
var userid = context.getVariable("userid");
var pwd = context.getVariable("pwd");
var sender = context.getVariable("sender");
var msgtxt = context.getVariable("msgtxt");
var dcode = context.getVariable("dcode");
var msgid = generateUUID();
var msgtype = context.getVariable("msgtype");
var apiKey = context.getVariable("apiKey");
var channel = context.getVariable("channel");
var userId = context.getVariable("userId");
var externalReferenceNo = generateUUID();
var bankCode = context.getVariable("bankCode");
var transactionBranch = context.getVariable("transactionBranch");
var refNo = context.getVariable("refNo");
var requestBody = {
  "OTPGenAndSMSEmailDispatchOrchestrationRequestDTO": {
    "requestString": {
      "splitOTP": "N",
      "E2FARequestDTO": {
        "instanceId": instanceId,
        "apiUser": apiUser,
        "refNo": refNo,
        "linkData": "000000091" + phoneNo,
        "messageHash": "static:genpwdreq:06:" + hashOutput
      },
      "AXIOMRequestDTO": {
        "userid": userid,
        "pwd": pwd,
        "sender": sender,
        "pno": phoneNo,
        "msgtxt": "Alert!\n#OTP# is your OTP to share your demographic details related to HDFC ERGO Insurance policy. Valid for 2 mins. Never share OTP\n-HDFC Bank",
        "dcode": dcode,
        "msgid": msgid,
        "msgtype": msgtype
      }
    },
    "headerParams": [
      {
        "key": "apiUser",
        "value": apiUser
      },
      {
        "key": "apiKey",
        "value": apiKey
      }
    ]
  },
  "sessionContext": {
    "channel": channel,
    "userId": userId,
    "externalReferenceNo": externalReferenceNo,
    "bankCode": bankCode,
    "transactionBranch": transactionBranch
  }
}
function generateUUID() {
    var uuid = '';
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (var i = 0; i < 32; i++) {
        var randomIndex = Math.floor(Math.random() * chars.length);
        uuid += chars[randomIndex];
    }
    return uuid;
}


context.setVariable("request.content", JSON.stringify(requestBody));
