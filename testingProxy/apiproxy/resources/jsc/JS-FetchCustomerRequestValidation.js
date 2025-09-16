var request = JSON.parse(context.getVariable("request.content"));
var isError = false;
var errorMessage = "";
if (request.AccountServiceRequest && request.AccountServiceRequest.soaFillers && request.AccountServiceRequest.soaFillers.filler4, isValidDateFormat(request.AccountServiceRequest.soaFillers.filler4)) {
  request.AccountServiceRequest.soaFillers.filler4 += "," + addOneDay(request.AccountServiceRequest.soaFillers.filler4);
  context.setVariable("request.content", JSON.stringify(request))
} else {
  isError = true;
  errorMessage = { Status: "ERROR", Meesage: "filler4 should be in DD-MM-YYYY formate" }
}
print(isValidDateFormat(request.AccountServiceRequest.soaFillers.filler4));
context.setVariable("isError", isError);
context.setVariable("errorMessage", JSON.stringify(errorMessage));

function addOneDay(dateString) {
  // Split the input string into day, month, year
  var parts = dateString.split('-');
  var day = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript
  var year = parseInt(parts[2], 10);

  // Create a new Date object
  var date = new Date(year, month, day);

  // Add one day
  date.setDate(date.getDate() + 1);

  // Format the new date back to DD-MM-YYYY format
  var newDay = ('0' + date.getDate()).slice(-2); // Add leading zero if necessary
  var newMonth = ('0' + (date.getMonth() + 1)).slice(-2); // Month is 0-indexed
  var newYear = date.getFullYear();

  // Return the new date as a string in DD-MM-YYYY format
  return newDay + '-' + newMonth + '-' + newYear;
}

function isValidDateFormat(dateString) {
  // Regular expression to match DD-MM-YYYY format
  var regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;

  // Check if the input matches the format
  if (!regex.test(dateString)) {
    return false;
  }

  // Split the input string into day, month, year
  var parts = dateString.split('-');
  var day = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);

  // Check if the date is valid by creating a Date object
  var date = new Date(year, month - 1, day); // JavaScript months are 0-indexed

  // Ensure the date object's day, month, and year match the input
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 && // JavaScript months are 0-indexed
    date.getDate() === day
  );
}