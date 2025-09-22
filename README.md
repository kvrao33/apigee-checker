# Apigee Proxy C## Command Line Options

### Core Options
- `-s, --source <path>`: Path to local proxy directory
- `-o, --org <name>`: Apigee organization name
- `-n, --name <name>`: Name of the proxy to analyze
- `-t, --token <token>`: Access token for Apigee authentication

### Revision Control
- `--rev <number>`: Specific revision to analyze
- `-e, --env <name>`: Environment name (will use deployed revision)

### Output Options
- `-f, --format <type>`: Output format (table/json/html)
- `-w, --write <file>`: Write results to file
- `-q, --quiet`: Suppress console output
- `-r, --rules <path>`: Custom rules file path

### Information
- `-v, --version`: Show version number
- `-h, --help`: Show help information powerful command-line tool that replaces manual Apigee proxy risk assessment with automated validation. Perfect for CI/CD pipelines, this tool helps ensure your Apigee proxies meet security standards, follow best practices, and maintain consistent policy implementation across your organization.

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
npm install -g apigee-checker
```

## Usage

### Local Proxy Validation with Custom Rules

The custom rules feature is a powerful way to define your organization's specific requirements and best practices. Here's how to use it:

```bash
# Structure your proxy folder
myproxy/
├── apiproxy/
│   ├── policies/
│   ├── proxies/
│   ├── targets/
│   └── myproxy.xml

# Create custom rules file (custom-rules.json)
{
  "flows": [
    {
      "endpoint": "ProxyEndpoint",
      "flow": "PreFlow",
      "direction": "Request",
      "conditions": [
        {
          "description": "Company security standards check",
          "anyOf": [
            { "name": "OAuth2-Verify", "type": "SharedFlow" },
            { "name": "Company-Auth-Flow", "type": "SharedFlow" }
          ]
        },
        {
          "description": "Required headers check",
          "allOf": [
            { "name": "Add-Correlation-ID", "type": "SharedFlow" },
            { "name": "Verify-API-Version", "type": "SharedFlow" }
          ]
        }
      ]
    }
  ]
}

# Run validation with custom rules
apigee-checker -s ./myproxy/apiproxy -r ./custom-rules.json -f html -w report.html

# Example with specific company requirements
apigee-checker -s ./banking-api/apiproxy -r ./banking-security-rules.json

# Multiple rule sets for different environments
apigee-checker -s ./payment-api/apiproxy -r ./pci-compliance-rules.json
apigee-checker -s ./payment-api/apiproxy -r ./dev-rules.json
```


### Remote Proxy Validation
```bash
# Validate latest revision
apigee-checker -o myorg -n myproxy -t $TOKEN

# Validate specific revision
apigee-checker -o myorg -n myproxy --rev 14 -t $TOKEN

# Validate deployed revision in environment
apigee-checker -o myorg -n myproxy -e test -t $TOKEN

# Generate JSON report for specific revision
apigee-checker -o myorg -n myproxy --rev 14 -t $TOKEN -f json -w report.json
```

## Options

- `-s, --source <path>`: Path to local proxy directory
- `-f, --format <type>`: Output format (table/json/html)
- `-w, --write <file>`: Write output to file
- `-o, --org <name>`: Apigee organization name
- `-e, --env <name>`: Apigee environment
- `-n, --name <name>`: Proxy name to download and validate
- `-r, --rules <path>`: Path to custom rules JSON file (optional)

## Custom Rules System

The custom rules system is a key feature that allows you to define and enforce your organization's specific requirements, compliance standards, and best practices. This replaces manual security reviews and ensures consistent policy implementation across all your APIs.

### Why Use Custom Rules?

1. **Organization-Specific Standards**
   - Enforce company-wide security policies
   - Maintain consistent error handling
   - Ensure required logging and monitoring

2. **Compliance Requirements**
   - PCI-DSS compliance for payment APIs
   - HIPAA compliance for healthcare APIs
   - GDPR/Data protection requirements
   - Banking regulations (PSD2, Open Banking)

3. **Environment-Specific Validation**
   - Different rules for dev/test/prod
   - Stricter security in production
   - Mock service requirements in development

### Default Rules

By default, the tool checks for:
- Authentication policies in PreFlow
- Rate limiting and spike arrest policies
- Required security policies in specific flows

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