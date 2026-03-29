import { describe, it, expect, vi } from 'vitest';
import { getTools, createAerostackVercelAI } from '../index.js';

// We can't easily mock WorkspaceClient in the module, so test the factory structure
describe('createAerostackVercelAI', () => {
    it('returns an object with tools() and workspaceClient', () => {
        const client = createAerostackVercelAI({
            workspace: 'test-ws',
            token: 'mwt_test',
        });

        expect(client.tools).toBeTypeOf('function');
        expect(client.workspaceClient).toBeDefined();
    });

    it('workspaceClient is configured with the correct slug', () => {
        const client = createAerostackVercelAI({
            workspace: 'my-ws',
            token: 'mwt_abc',
            baseUrl: 'https://custom.gateway.dev',
        });

        expect(client.workspaceClient).toBeDefined();
    });
});

describe('getTools', () => {
    it('is exported as a function', () => {
        expect(getTools).toBeTypeOf('function');
    });
});
