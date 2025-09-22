const { downloadProxyBundle } = require('../../src/services/downloader');
const fs = require('node:fs');
const path = require('node:path');

// Mock node:stream
jest.mock('node:stream', () => ({
    Readable: {
        fromWeb: jest.fn(() => ({
            pipe: jest.fn(() => ({
                on: jest.fn().mockReturnThis(),
                once: jest.fn().mockReturnThis(),
                emit: jest.fn().mockReturnThis()
            }))
        }))
    }
}));

// Mock node:stream/promises
jest.mock('node:stream/promises', () => ({
    finished: jest.fn().mockResolvedValue()
}));

// Mock fs
jest.mock('node:fs', () => ({
    createWriteStream: jest.fn(() => ({
        write: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        once: jest.fn().mockReturnThis(),
        emit: jest.fn().mockReturnThis()
    }))
}));

// Mock tmp
jest.mock('tmp', () => ({
    dirSync: jest.fn(() => ({
        name: '/tmp/mock-dir',
        removeCallback: jest.fn()
    }))
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('downloadProxyBundle', () => {
    const mockOptions = {
        proxyName: 'test-proxy',
        org: 'test-org',
        token: 'test-token'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock successful responses for revision checks
        global.fetch.mockImplementation((url) => {
            if (url.includes('revisions') && !url.includes('format=bundle')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(['1', '2', '3'])
                });
            }
            // Mock bundle download response
            return Promise.resolve({
                ok: true,
                status: 200,
                body: {
                    getReader: () => ({
                        read: () => Promise.resolve({ done: true, value: new Uint8Array() })
                    }),
                    pipeTo: jest.fn().mockResolvedValue(undefined),
                    pipe: jest.fn().mockReturnThis()
                }
            });
        });
    });

    test('should throw error when required parameters are missing', async () => {
        await expect(downloadProxyBundle({}))
            .rejects
            .toThrow('Missing required parameters: proxyName, org, and token are mandatory');
    });

    test('should download specific revision when provided', async () => {
        const options = { ...mockOptions, rev: '2' };
        const result = await downloadProxyBundle(options);
        
        expect(result).toBe('/tmp/mock-dir/test-proxy-r2.zip');
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/apis/test-proxy/revisions/2'),
            expect.any(Object)
        );
    });

    test('should get latest revision when no revision or environment specified', async () => {
        const result = await downloadProxyBundle(mockOptions);
        
        expect(result).toBe('/tmp/mock-dir/test-proxy-r3.zip');
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/apis/test-proxy/revisions'),
            expect.any(Object)
        );
    });

    test('should get deployed revision when environment is specified', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/environments/')) {
                if (url.includes('/deployments')) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({
                            deployments: [{ revision: '2' }]
                        })
                    });
                }
                return Promise.resolve({ ok: true, status: 200 });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                body: {
                    getReader: () => ({
                        read: () => Promise.resolve({ done: true, value: new Uint8Array() })
                    }),
                    pipeTo: jest.fn().mockResolvedValue(undefined),
                    pipe: jest.fn().mockReturnThis()
                }
            });
        });

        const options = { ...mockOptions, env: 'test-env' };
        const result = await downloadProxyBundle(options);
        
        expect(result).toBe('/tmp/mock-dir/test-proxy-r2.zip');
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/environments/test-env'),
            expect.any(Object)
        );
    });

    test('should throw error for invalid revision number', async () => {
        const options = { ...mockOptions, rev: 'invalid' };
        await expect(downloadProxyBundle(options))
            .rejects
            .toThrow('Invalid revision number');
    });

    test('should throw error when revision does not exist', async () => {
        global.fetch.mockImplementationOnce((url) => {
            if (url.includes('/revisions/')) {
                return Promise.resolve({ status: 404, ok: false });
            }
            return Promise.resolve({
                ok: true,
                body: {
                    getReader: () => ({
                        read: () => Promise.resolve({ done: true })
                    }),
                    pipeTo: jest.fn(),
                    pipe: jest.fn()
                }
            });
        });

        const options = { ...mockOptions, rev: '999' };
        await expect(downloadProxyBundle(options))
            .rejects
            .toThrow('Revision 999 of proxy test-proxy does not exist');
    });

    test('should throw error when environment does not exist', async () => {
        global.fetch.mockImplementationOnce((url) => {
            if (url.includes('/environments/')) {
                return Promise.resolve({ status: 404, ok: false });
            }
            return Promise.resolve({
                ok: true,
                body: {
                    getReader: () => ({
                        read: () => Promise.resolve({ done: true })
                    }),
                    pipeTo: jest.fn(),
                    pipe: jest.fn()
                }
            });
        });

        const options = { ...mockOptions, env: 'non-existent-env' };
        await expect(downloadProxyBundle(options))
            .rejects
            .toThrow('Environment non-existent-env does not exist');
    });

    test('should throw error when no deployments found in environment', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/environments/')) {
                if (url.includes('/deployments')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ deployments: [] })
                    });
                }
                return Promise.resolve({ ok: true });
            }
            return Promise.resolve({
                ok: true,
                body: {
                    getReader: () => ({
                        read: () => Promise.resolve({ done: true })
                    }),
                    pipeTo: jest.fn(),
                    pipe: jest.fn()
                }
            });
        });

        const options = { ...mockOptions, env: 'test-env' };
        await expect(downloadProxyBundle(options))
            .rejects
            .toThrow('No deployments found for proxy test-proxy in environment test-env');
    });
});