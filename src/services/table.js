const chalk = require("chalk");
const { table } = require("table");

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

  validationResults.forEach((result) => {
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
  validationData.forEach((endpointObj) => {
    endpointObj.validationResults.forEach((vr) => {
      printValidationTable(
        `${endpointObj.endpoint} : ${endpointObj.name}`,
        vr.flow,
        vr.direction,
        vr.conditionalFlowName,
        vr.validationResult
      );
    });
  });
}

module.exports = { printValidationResultTable };
