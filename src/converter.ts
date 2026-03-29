/**
 * Converts Aerostack McpTool definitions to Vercel AI SDK tool format.
 */
import { tool, jsonSchema } from 'ai';
import type { ToolSet as VercelToolSet } from 'ai';
import { WorkspaceClient, AerostackError } from '@aerostack/core';
import type { McpTool, McpToolResult } from '@aerostack/core';

/**
 * Convert McpTool array to Vercel AI SDK ToolSet.
 *
 * Each tool gets an `execute` function that proxies through WorkspaceClient.callTool().
 * Tool names are used as-is (Vercel AI SDK has no name restrictions like OpenAI).
 *
 * @param mcpTools - Tools from WorkspaceClient.listTools()
 * @param client - WorkspaceClient instance for executing tool calls
 */
export function convertTools(mcpTools: McpTool[], client: WorkspaceClient): VercelToolSet {
    const tools: VercelToolSet = {};

    for (const mcpTool of mcpTools) {
        if (!mcpTool.name) continue;

        const parameters = mcpTool.inputSchema
            ? jsonSchema(mcpTool.inputSchema as Parameters<typeof jsonSchema>[0])
            : jsonSchema({ type: 'object' as const, properties: {} });

        tools[mcpTool.name] = tool({
            description: mcpTool.description ?? '',
            parameters,
            execute: async (args) => {
                try {
                    const result = await client.callTool(mcpTool.name, args as Record<string, unknown>);
                    return formatToolResult(result);
                } catch (err) {
                    if (err instanceof AerostackError) {
                        return `Error (${err.rpcCode}): ${err.message}`;
                    }
                    return err instanceof Error
                        ? `Error: ${err.message}`
                        : 'Error: Unknown error executing tool';
                }
            },
        });
    }

    return tools;
}

/**
 * Flatten McpToolResult content array into a single string.
 */
export function formatToolResult(result: McpToolResult): string {
    if (!result.content || result.content.length === 0) {
        return result.isError ? 'Error: Tool returned no content' : 'Success (no output)';
    }

    const parts: string[] = [];
    for (const block of result.content) {
        if (block.text) {
            parts.push(block.text);
        } else if (block.data) {
            parts.push(`[${block.mimeType ?? 'binary'} data: ${block.data.length} chars base64]`);
        } else {
            parts.push(JSON.stringify(block));
        }
    }

    const text = parts.join('\n');
    return result.isError ? `Error: ${text}` : text;
}
