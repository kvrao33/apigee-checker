/*
 * Copyright © 2024-2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('node:fs');
const { Readable } = require('node:stream');
const { finished } = require('node:stream/promises');
const path = require('node:path');
const tmp = require('tmp');
const extract = require('extract-zip');

/**
 * Downloads an Apigee proxy bundle
 * @param {Object} options - The download options
 * @param {string} options.proxyName - Name of the proxy to download
 * @param {string} options.org - Apigee organization name
 * @param {string} options.token - Access token for authentication
 * @param {string} [options.env] - Environment name (optional)
 * @param {string|number} [options.rev] - Revision number (optional)
 * @returns {Promise<string>} Path to the downloaded bundle
 */
async function downloadProxyBundle({ proxyName, org, token, env, rev }) {
    if (!proxyName || !org || !token) {
        throw new Error('Missing required parameters: proxyName, org, and token are mandatory');
    }

    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const urlBase = `https://apigee.googleapis.com/v1/organizations/${org}`;

    try {
        // Determine which revision to download
        const revision = await determineRevision();
        if (!revision) {
            throw new Error('Could not determine revision to download');
        }

        // Download the bundle
        return await downloadBundle(revision);

        async function determineRevision() {
            // If specific revision is provided and not "latest", use it
            if (rev && rev.toString().toLowerCase() !== 'latest') {
                const numRev = Number(rev);
                if (isNaN(numRev)) {
                    throw new Error('Invalid revision number');
                }
                await verifyRevisionExists(numRev);
                return numRev;
            }

            // If environment is specified, get deployed revision
            if (env) {
                return await getDeployedRevision();
            }

            // Otherwise get latest revision
            return await getLatestRevision();
        }

        async function verifyRevisionExists(revision) {
            const url = `${urlBase}/apis/${proxyName}/revisions/${revision}`;
            const response = await fetch(url, { headers });
            
            if (response.status === 404) {
                throw new Error(`Revision ${revision} of proxy ${proxyName} does not exist`);
            }
            
            if (!response.ok) {
                throw new Error(`Failed to verify revision ${revision}: ${response.status}`);
            }
        }

        async function getLatestRevision() {
            const url = `${urlBase}/apis/${proxyName}/revisions`;
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to get revisions: ${response.status}`);
            }

            const revisions = await response.json();
            if (!Array.isArray(revisions) || !revisions.length) {
                throw new Error('No revisions found for proxy');
            }

            // Sort numerically and get the latest
            return Math.max(...revisions.map(r => Number(r)));
        }

        async function getDeployedRevision() {
            // First verify environment exists
            const envUrl = `${urlBase}/environments/${env}`;
            const envResponse = await fetch(envUrl, { headers });
            
            if (envResponse.status === 404) {
                throw new Error(`Environment ${env} does not exist`);
            }
            
            if (!envResponse.ok) {
                throw new Error(`Failed to verify environment ${env}: ${envResponse.status}`);
            }

            // Get deployment info
            const deployUrl = `${urlBase}/environments/${env}/apis/${proxyName}/deployments`;
            const deployResponse = await fetch(deployUrl, { headers });
            
            if (!deployResponse.ok) {
                throw new Error(`Failed to get deployment info: ${deployResponse.status}`);
            }

            const deployData = await deployResponse.json();
            if (!deployData.deployments || !deployData.deployments.length) {
                throw new Error(`No deployments found for proxy ${proxyName} in environment ${env}`);
            }

            // Get the latest deployed revision
            return Number(deployData.deployments.reduce((latest, dep) => {
                const revNum = Number(dep.revision);
                return revNum > latest ? revNum : latest;
            }, 0));
        }

        async function downloadBundle(revision) {
            const url = `${urlBase}/apis/${proxyName}/revisions/${revision}?format=bundle`;
            
            // Create temp directory
            const tmpDir = tmp.dirSync({
                prefix: 'apigee-proxy-download-',
                unsafeCleanup: true,
                keep: false // Always cleanup on process exit
            });

            // Ensure cleanup on various events
            const cleanup = () => {
                try {
                    tmpDir.removeCallback();
                } catch (error) {
                    console.error('Failed to cleanup temp directory:', error);
                }
            };

            // Clean up on process exit, SIGINT (Ctrl+C), and uncaught exceptions
            process.on('exit', cleanup);
            process.on('SIGINT', () => {
                cleanup();
                process.exit(1);
            });
            process.on('uncaughtException', (error) => {
                console.error('Uncaught Exception:', error);
                cleanup();
                process.exit(1);
            });

            const zipPath = path.join(tmpDir.name, `${proxyName}-r${revision}.zip`);
            const extractPath = path.join(tmpDir.name, 'extracted');
            
            // Create extraction directory
            fs.mkdirSync(extractPath, { recursive: true });
            
            // Download the bundle
            const writeStream = fs.createWriteStream(zipPath);
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`Failed to download bundle: ${response.status}`);
            }

            await finished(Readable.fromWeb(response.body).pipe(writeStream));
            
            // Extract the ZIP file
            try {
                await extract(zipPath, { dir: extractPath });
                // Remove the ZIP file after extraction
                fs.unlinkSync(zipPath);
                return {
                    path: extractPath,
                    revision: revision
                };
            } catch (error) {
                throw new Error(`Failed to extract proxy bundle: ${error.message}`);
            }
        }

    } catch (error) {
        console.error(`Error: Failed to download proxy bundle: ${error.message}`);
        return null;
    }
}

module.exports = {
    downloadProxyBundle
};
