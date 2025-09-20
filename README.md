# Apigee Proxy Checker

A powerful command-lin## CI/CD Integration

This tool is designed to be a crucial part of your CI/CD pipeline for Apigee proxy development. It helps:

- Prevent deployment of non-compliant proxies
- Ensure consistent security policies across environments
- Automate risk assessment in your deployment pipeline
- Generate compliance reports for auditing

See [CI/CD Integration Examples](./examples/ci-cd-integration.md) for detailed pipeline configurations for:
- GitHub Actions
- Jenkins
- Azure DevOps

## Options

- `-s, --source <path>`: Path to local proxy directory
- `-f, --format <type>`: Output format (table/json/html)
- `-w, --write <file>`: Write output to file
- `-o, --org <name>`: Apigee organization name
- `-e, --env <name>`: Apigee environment
- `-n, --name <name>`: Proxy name to download and validate
- `-r, --rules <path>`: Path to custom rules JSON file (optional)

### Exit Codes

- `0`: Validation successful - all rules passed
- `1`: Validation failed - one or more rules failed
- `2`: Execution error (invalid arguments, file not found, etc.)at replaces manual Apigee proxy risk assessment with automated validation. Perfect for CI/CD pipelines, this tool helps ensure your Apigee proxies meet security standards, follow best practices, and maintain consistent policy implementation across your organization.

## Features

- Automated Risk Assessment
  - Security policy validation
  - Best practices enforcement
  - Policy compliance checking
  - Flow consistency verification
  
- CI/CD Integration
  - Exit codes for pipeline decisions
  - Multiple output formats (JSON/HTML/Table)
  - Custom rule sets for different environments
  - Automated validation reports
  
- Flexible Deployment Validation
  - Local proxy validation
  - Remote proxy download and validation
  - Pre-deployment checks
  - Post-deployment verification

## Installation

```bash
npm install -g apigee-proxy-checker
```

## Usage

```bash
# Validate a local proxy
apigee-checker -s ./path/to/proxy

# Validate with specific output format (table, json, html)
apigee-checker -s ./path/to/proxy -f json

# Save output to a file
apigee-checker -s ./path/to/proxy -f html -w report.html

# Validate a remote proxy (requires authentication)
apigee-checker -o org -e env -n proxy-name
```

## Options

- `-s, --source <path>`: Path to local proxy directory
- `-f, --format <type>`: Output format (table/json/html)
- `-w, --write <file>`: Write output to file
- `-o, --org <name>`: Apigee organization name
- `-e, --env <name>`: Apigee environment
- `-n, --name <name>`: Proxy name to download and validate
- `-r, --rules <path>`: Path to custom rules JSON file (optional)

## Validation Rules

The tool uses a set of predefined rules to validate your Apigee proxy. These rules ensure best practices and security standards are followed. You can also provide your own custom rules file.

### Default Rules

By default, the tool checks for:
- Authentication policies in PreFlow
- Rate limiting and spike arrest policies
- Required security policies in specific flows
- Proper use of SharedFlows
- Flow-specific policy requirements

### Custom Rules

You can create your own rules file in JSON format. Here's an example:

```json
{
  "flows": [
    {
      "endpoint": "ProxyEndpoint",
      "flow": "PreFlow",
      "direction": "Request",
      "conditions": [
        {
          "description": "Security policies check",
          "anyOf": [
            { "name": "OAuth2-Verify", "type": "Policy" },
            { "name": "Verify-API-Key", "type": "Policy" },
            { "name": "JWT-Verify", "type": "Policy" }
          ]
        },
        {
          "description": "Traffic management policies",
          "allOf": [
            { "name": "Spike-Arrest", "type": "Policy" },
            { "name": "Rate-Limit", "type": "Policy" }
          ]
        }
      ]
    },
    {
      "endpoint": "ProxyEndpoint",
      "flow": "ConditionalFlow",
      "direction": "Request",
      "conditionalFlowName":"flow-1",
      "conditions": [
        {
          "description": "Content validation required for POST/PUT requests",
          "allOf": [
            { "name": "JSON-Threat-Protection", "type": "Policy" },
            { "name": "XML-Threat-Protection", "type": "Policy" },
            { "name": "Input-Validation", "type": "SharedFlow" }
          ]
        }
      ]
    },
    {
      "endpoint": "TargetEndpoint",
      "flow": "PostFlow",
      "direction": "Response",
      "conditions": [
        {
          "description": "Response headers and CORS policy",
          "allOf": [
            { "name": "Set-Response-Headers", "type": "Policy" },
            { "name": "CORS", "type": "Policy" }
          ]
        }
      ]
    }
  ]
}
```

### Rule Structure

- `endpoint`: The endpoint type (`ProxyEndpoint` or `TargetEndpoint`)
- `flow`: The flow type (`PreFlow`, `PostFlow`, or `ConditionalFlow`)
- `direction`: The flow direction (`Request` or `Response`)
- `conditionalFlowName`: The name of your conditional flow 
- `conditions`: Array of conditions to check
  - `anyOf`: At least one policy/flow must be present
  - `allOf`: All policies/flows must be present
  - `description`: Human-readable description of the condition
  - `name`: Name of the policy or SharedFlow
  - `type`: Type of the check (`Policy` or `SharedFlow`)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contributors

- Karthik V Rao
- Dileep Kumar

## License

MIT License

## Support

For bugs and feature requests, please create an issue on [GitHub](https://github.com/kvrao33/apigee-checker/issues).