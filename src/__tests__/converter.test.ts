import { describe, it, expect, vi } from 'vitest';
import { convertTools, formatToolResult } from '../converter.js';
import { WorkspaceClient } from '@aerostack/core';
import type { McpTool } from '@aerostack/core';

function mockClient(callToolResult: unknown, shouldThrow = false): WorkspaceClient {
    return {
        callTool: shouldThrow
            ? vi.fn().mockRejectedValue(callToolResult)
            : vi.fn().mockResolvedValue(callToolResult),
    } as unknown as WorkspaceClient;
}

describe('convertTools', () => {
    it('converts MCP tools to Vercel AI SDK ToolSet', () => {
        const mcpTools: McpTool[] = [
            {
                name: 'github__create_issue',
                description: 'Create a GitHub issue',
                inputSchema: {
                    type: 'object',
                    properties: { title: { type: 'string' } },
                    required: ['title'],
                },
            },
            {
                name: 'slack__post_message',
                description: 'Post to Slack',
                inputSchema: {
                    type: 'object',
                    properties: { channel: { type: 'string' }, text: { type: 'string' } },
                },
            },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(Object.keys(tools)).toEqual(['github__create_issue', 'slack__post_message']);
        expect(tools['github__create_issue']).toBeDefined();
        expect(tools['slack__post_message']).toBeDefined();
    });

    it('handles tools with no inputSchema', () => {
        const mcpTools: McpTool[] = [
            { name: 'ping', description: 'Ping the server' },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(tools['ping']).toBeDefined();
    });

    it('handles tools with no description', () => {
        const mcpTools: McpTool[] = [
            { name: 'my_tool', inputSchema: { type: 'object', properties: {} } },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(tools['my_tool']).toBeDefined();
    });

    it('skips tools with empty names', () => {
        const mcpTools: McpTool[] = [
            { name: '', description: 'Bad tool' },
            { name: 'good_tool', description: 'Good tool' },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(Object.keys(tools)).toEqual(['good_tool']);
    });

    it('handles empty tools array', () => {
        const client = mockClient({});
        const tools = convertTools([], client);
        expect(Object.keys(tools)).toEqual([]);
    });

    it('execute function calls WorkspaceClient.callTool', async () => {
        const mcpTools: McpTool[] = [
            {
                name: 'test_tool',
                description: 'Test',
                inputSchema: { type: 'object', properties: { x: { type: 'number' } } },
            },
        ];

        const client = mockClient({
            content: [{ type: 'text', text: 'result123' }],
        });
        const tools = convertTools(mcpTools, client);

        const result = await tools['test_tool']!.execute!({ x: 42 }, { toolCallId: 'tc_1', messages: [], abortSignal: new AbortController().signal });

        expect(client.callTool).toHaveBeenCalledWith('test_tool', { x: 42 });
        expect(result).toBe('result123');
    });

    it('execute function handles AerostackError gracefully', async () => {
        const { AerostackError } = await import('@aerostack/core');
        const err = new AerostackError('Server down', 503, -32603, 'req-1');
        const client = mockClient(err, true);

        const mcpTools: McpTool[] = [
            { name: 'failing_tool', description: 'Fails' },
        ];

        const tools = convertTools(mcpTools, client);
        const result = await tools['failing_tool']!.execute!({}, { toolCallId: 'tc_1', messages: [], abortSignal: new AbortController().signal });

        expect(result).toContain('Error (-32603)');
        expect(result).toContain('Server down');
    });

    it('execute function handles generic errors', async () => {
        const client = mockClient(new Error('Network timeout'), true);

        const mcpTools: McpTool[] = [
            { name: 'timeout_tool', description: 'Timeouts' },
        ];

        const tools = convertTools(mcpTools, client);
        const result = await tools['timeout_tool']!.execute!({}, { toolCallId: 'tc_1', messages: [], abortSignal: new AbortController().signal });

        expect(result).toBe('Error: Network timeout');
    });
});

describe('formatToolResult', () => {
    it('formats single text content', () => {
        expect(formatToolResult({
            content: [{ type: 'text', text: 'Hello' }],
        })).toBe('Hello');
    });

    it('concatenates multiple text blocks', () => {
        expect(formatToolResult({
            content: [
                { type: 'text', text: 'Line 1' },
                { type: 'text', text: 'Line 2' },
            ],
        })).toBe('Line 1\nLine 2');
    });

    it('handles binary data blocks', () => {
        const result = formatToolResult({
            content: [{ type: 'image', data: 'abc123', mimeType: 'image/png' }],
        });
        expect(result).toContain('image/png');
    });

    it('prefixes error results', () => {
        expect(formatToolResult({
            content: [{ type: 'text', text: 'Something failed' }],
            isError: true,
        })).toBe('Error: Something failed');
    });

    it('handles empty content', () => {
        expect(formatToolResult({ content: [] })).toBe('Success (no output)');
        expect(formatToolResult({})).toBe('Success (no output)');
    });

    it('handles empty content with isError', () => {
        expect(formatToolResult({ content: [], isError: true })).toBe('Error: Tool returned no content');
    });
});
