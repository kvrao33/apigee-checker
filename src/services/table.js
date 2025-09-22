const chalk = require("chalk");
const { table } = require("table");

function generateHtml(validationData) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Apigee Proxy Validation Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .success { color: #28a745; }
    .failure { color: #dc3545; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .endpoint { color: #007bff; font-size: 1.2em; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>Apigee Proxy Validation Results</h1>
`;

  let totalRules = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  validationData.forEach((endpointObj) => {
    endpointObj.validationResults.forEach((vr) => {
      html += `<h2 class="endpoint">${endpointObj.endpoint} : ${endpointObj.name}</h2>`;
      html += `<table>
        <tr>
          <th>Flow</th>
          <th>Direction</th>
          <th>Status</th>
          <th>Description</th>
          <th>Met Conditions</th>
          <th>Not Met Conditions</th>
        </tr>`;

      vr.validationResult.forEach(result => {
        totalRules++;
        if (result.success) totalPassed++;
        else totalFailed++;

        html += `
        <tr>
          <td>${vr.flow || ''}</td>
          <td>${vr.direction}</td>
          <td class="${result.success ? 'success' : 'failure'}">${result.success ? '✔ Success' : '✖ Failed'}</td>
          <td>${result.description}</td>
          <td>${result.metConditions.map(c => `${c.name} (${c.type})`).join(', ') || 'None'}</td>
          <td>${result.notMetConditions.map(c => `${c.name} (${c.type})`).join(', ') || 'None'}</td>
        </tr>`;
      });

      html += '</table>';
    });
  });

  // Add final summary
  html += `
  <div class="summary">
    <h2>Final Summary</h2>
    <p><strong>Total Rules Checked:</strong> ${totalRules}</p>
    <p class="success"><strong>✔ Passed:</strong> ${totalPassed}</p>
    <p class="failure"><strong>✖ Failed:</strong> ${totalFailed}</p>
  </div>
  </body>
  </html>`;

  return { html, summary: { totalRules, totalPassed, totalFailed } };
}

function printValidationTable(
  endpointName,
  flow,
  direction,
  conditionalFlowName,
  validationResults
) {
  // Build table rows
  const rows = [
    [
      chalk.bold("Flow"),
      chalk.bold("Direction"),
      chalk.bold("Status"),
      chalk.bold("Description"),
      chalk.bold("metConditions"),
      chalk.bold("notMetConditions")
    ]
  ];

  let passedCount = 0;
  let failedCount = 0;

  validationResults.forEach((result) => {
    if (result.success) {
      passedCount++;
    } else {
      failedCount++;
    }

    rows.push([
      flow === "ConditionalFlow" ? conditionalFlowName : flow,
      direction,
      result.success ? chalk.green("✔ Success") : chalk.red("✖ Failed"),
      result.description,
      result.metConditions.map((c) => `${c.name} (${c.type})`).join(", ") ||
        "None",
      result.notMetConditions.map((c) => `${c.name} (${c.type})`).join(", ") ||
        "None"
    ]);
  });

  // Add summary row
  rows.push([
    chalk.yellow("Summary"),
    "",
    "",
    chalk.yellow(`Total Rules: ${passedCount + failedCount}`),
    chalk.green(`✅ Passed: ${passedCount}`),
    chalk.red(`❌ Failed: ${failedCount}`)
  ]);

  // Render table
  const output = table(rows, {
    columns: {
      0: { width: 10 },
      1: { width: 12 },
      2: { width: 12 },
      3: { width: 40, wrapWord: true },
      4: { width: 30, wrapWord: true },
      5: { width: 30, wrapWord: true }
    }
  });

  console.log(chalk.cyan(`\n${endpointName}\n`));
  console.log(output);
}

function printValidationResultTable(validationData) {
  let totalRules = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  validationData.forEach((endpointObj) => {
    endpointObj.validationResults.forEach((vr) => {
      printValidationTable(
        `${endpointObj.endpoint} : ${endpointObj.name}`,
        vr.flow,
        vr.direction,
        vr.conditionalFlowName,
        vr.validationResult
      );

      // Count results for final summary
      vr.validationResult.forEach(result => {
        totalRules++;
        if (result.success) {
          totalPassed++;
        } else {
          totalFailed++;
        }
      });
    });
  });

  // Print final summary
  console.log(chalk.yellow("\n📊 Final Summary"));
  console.log("═".repeat(50));
  console.log(chalk.bold(`Total Rules Checked: ${totalRules}`));
  console.log(chalk.green(`✅ Passed: ${totalPassed}`));
  console.log(chalk.red(`❌ Failed: ${totalFailed}`));
  console.log("═".repeat(50));

  return { totalRules, totalPassed, totalFailed };
}

module.exports = { printValidationResultTable, generateHtml };
