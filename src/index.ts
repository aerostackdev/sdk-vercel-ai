/**
 * @aerostack/sdk-vercel-ai — Use Aerostack workspace tools with the Vercel AI SDK.
 *
 * @example
 * ```ts
 * import { openai } from '@ai-sdk/openai';
 * import { generateText } from 'ai';
 * import { getTools } from '@aerostack/sdk-vercel-ai';
 *
 * const tools = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });
 *
 * const { text } = await generateText({
 *     model: openai('gpt-4o'),
 *     tools,
 *     maxSteps: 5,
 *     prompt: 'Create a GitHub issue for the login bug',
 * });
 * ```
 *
 * @example Factory pattern
 * ```ts
 * const client = createAerostackVercelAI({ workspace: 'my-workspace', token: 'mwt_...' });
 * const tools = await client.tools();
 *
 * const { text } = await streamText({
 *     model: anthropic('claude-sonnet-4-20250514'),
 *     tools,
 *     maxSteps: 10,
 *     prompt: 'Summarize the latest Notion pages and post to Slack',
 * });
 * ```
 */

import type { ToolSet as VercelToolSet } from 'ai';
import { WorkspaceClient } from '@aerostack/core';
import type { McpTool } from '@aerostack/core';
import { convertTools } from './converter.js';

export { formatToolResult } from './converter.js';

export interface WorkspaceConfig {
    /** Workspace slug */
    workspace: string;
    /** Workspace token (mwt_...) */
    token: string;
    /** Override gateway base URL */
    baseUrl?: string;
}

/** Result from getTools — includes both the Vercel AI tools and the raw MCP tools. */
export interface ToolSetResult {
    /** Vercel AI SDK ToolSet — drop into generateText/streamText({ tools }) */
    tools: VercelToolSet;
    /** Raw MCP tools from the workspace for inspection */
    raw: McpTool[];
}

function createWorkspaceClient(config: WorkspaceConfig): WorkspaceClient {
    return new WorkspaceClient({
        slug: config.workspace,
        token: config.token,
        baseUrl: config.baseUrl,
    });
}

// ---------------------------------------------------------------------------
// Standalone function
// ---------------------------------------------------------------------------

/**
 * Fetch tools from an Aerostack workspace and convert to Vercel AI SDK format.
 *
 * Each tool includes an `execute` function that calls the workspace gateway,
 * so you just pass the tools to `generateText` / `streamText` and it works.
 */
export async function getTools(config: WorkspaceConfig): Promise<ToolSetResult> {
    const client = createWorkspaceClient(config);
    const raw = await client.listTools();
    const tools = convertTools(raw, client);
    return { tools, raw };
}

// ---------------------------------------------------------------------------
// Factory pattern
// ---------------------------------------------------------------------------

export interface AerostackVercelAIClient {
    /** Fetch and convert workspace tools to Vercel AI SDK format. */
    tools(): Promise<ToolSetResult>;
    /** Access the underlying WorkspaceClient for advanced use. */
    readonly workspaceClient: WorkspaceClient;
}

/**
 * Create a reusable Aerostack Vercel AI client.
 *
 * Reuses a single WorkspaceClient instance across tool calls.
 */
export function createAerostackVercelAI(config: WorkspaceConfig): AerostackVercelAIClient {
    const wsClient = createWorkspaceClient(config);

    return {
        async tools(): Promise<ToolSetResult> {
            const raw = await wsClient.listTools();
            const tools = convertTools(raw, wsClient);
            return { tools, raw };
        },

        get workspaceClient(): WorkspaceClient {
            return wsClient;
        },
    };
}
