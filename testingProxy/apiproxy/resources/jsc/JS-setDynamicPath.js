var pathsuffix=context.getVariable("proxy.pathsuffix");
context.setVariable("dynamicPath","");
if(pathsuffix==="/genOtp"){
context.setVariable("dynamicPath","/api/v4/otp-gen");
context.setVariable("target.copy.pathsuffix",false);
}else if(pathsuffix==="/validateOtp"){
context.setVariable("dynamicPath","/api/v4/otp-val");
context.setVariable("target.copy.pathsuffix",false);
}