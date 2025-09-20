# CI/CD Integration Examples

## GitHub Actions Example

```yaml
name: Apigee Proxy Validation

on:
  pull_request:
    paths:
      - 'apiproxy/**'

jobs:
  validate-proxy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install Apigee Checker
        run: npm install -g apigee-proxy-checker
      
      - name: Validate Proxy
        run: |
          apigee-checker -s ./apiproxy -f json -w report.json
        # Non-zero exit code will fail the pipeline if validation fails
      
      - name: Upload Validation Report
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: validation-report
          path: report.json
```

## Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Validate Apigee Proxy') {
            steps {
                script {
                    // Install the checker
                    sh 'npm install -g apigee-proxy-checker'
                    
                    // Run validation with custom rules
                    def exitCode = sh(
                        script: """
                            apigee-checker \
                              -s ./apiproxy \
                              -f html \
                              -w validation-report.html \
                              -r ./ci/prod-rules.json
                        """,
                        returnStatus: true
                    )
                    
                    // Archive the report
                    archiveArtifacts artifacts: 'validation-report.html'
                    
                    // Fail the build if validation fails
                    if (exitCode != 0) {
                        error 'Proxy validation failed'
                    }
                }
            }
        }
    }
}
```

## Azure DevOps Pipeline Example

```yaml
trigger:
  paths:
    include:
      - apiproxy/*

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '16.x'

- script: npm install -g apigee-proxy-checker
  displayName: 'Install Apigee Checker'

- script: |
    apigee-checker \
      -s $(System.DefaultWorkingDirectory)/apiproxy \
      -f json \
      -w $(Build.ArtifactStagingDirectory)/validation-report.json
  displayName: 'Validate Apigee Proxy'
  
- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: $(Build.ArtifactStagingDirectory)
    artifactName: ValidationReport
  condition: always()
```