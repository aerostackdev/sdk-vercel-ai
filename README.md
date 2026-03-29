# @aerostack/sdk-vercel-ai

Use [Aerostack](https://aerostack.dev) workspace tools with the [Vercel AI SDK](https://sdk.vercel.ai/).

**Aerostack** is the full-stack platform for AI agents — compose MCP servers, skills, and functions into a single workspace URL that any AI agent can call. This SDK lets you drop 250+ pre-built tools into your Vercel AI app in 3 lines of code.

[![npm version](https://img.shields.io/npm/v/@aerostack/sdk-vercel-ai.svg)](https://www.npmjs.com/package/@aerostack/sdk-vercel-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why?

The Vercel AI SDK supports tool calling across any LLM provider — but you still need to build and maintain each tool integration yourself. With Aerostack, you compose a workspace of tools (GitHub, Slack, Notion, Stripe, 250+ more) and this SDK makes them instantly available to `generateText`, `streamText`, or any AI provider.

```
Your App → Vercel AI SDK → @aerostack/sdk-vercel-ai → Aerostack Workspace → GitHub, Slack, Notion, ...
```

## Install

```bash
npm install @aerostack/sdk-vercel-ai ai
```

## Quick Start

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getTools } from '@aerostack/sdk-vercel-ai';

const { tools } = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });

const { text } = await generateText({
    model: openai('gpt-4o'),
    tools,
    maxSteps: 5,
    prompt: 'Create a GitHub issue for the login bug',
});
```

That's it. Tools auto-execute — no `handleToolCall` needed. The Vercel AI SDK handles the tool-call loop for you with `maxSteps`.

## Streaming

```typescript
import { streamText } from 'ai';

const { tools } = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });

const result = streamText({
    model: openai('gpt-4o'),
    tools,
    maxSteps: 10,
    prompt: 'Summarize Notion pages and post to Slack',
});

for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
}
```

## Works With Any Provider

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// Claude
const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    tools,
    maxSteps: 5,
    prompt: 'Check GitHub PRs and notify on Slack',
});

// Gemini
const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    tools,
    maxSteps: 5,
    prompt: 'Search Notion and create a report',
});
```

## Factory Pattern

For reusable clients that share a single connection:

```typescript
import { createAerostackVercelAI } from '@aerostack/sdk-vercel-ai';

const aero = createAerostackVercelAI({ workspace: 'my-workspace', token: 'mwt_...' });
const { tools } = await aero.tools();
```

## API Reference

### `getTools(config)` → `Promise<ToolSetResult>`

Fetches tools from the workspace and converts to Vercel AI SDK `ToolSet` format. Each tool includes an `execute` function that calls the workspace gateway. Returns `{ tools, raw }`.

### `createAerostackVercelAI(config)` → `AerostackVercelAIClient`

Creates a reusable client that shares a single WorkspaceClient instance.

### `formatToolResult(result)`

Lower-level utility to flatten MCP tool results into strings.

## How It Works

1. **Tool Discovery** — `getTools()` calls your Aerostack workspace gateway to fetch all connected MCP server tools
2. **Format Conversion** — MCP tool schemas are wrapped with `jsonSchema()` from the AI SDK — zero conversion overhead since both use JSON Schema
3. **Auto-Execution** — Each tool gets a built-in `execute` function that proxies calls through the workspace gateway to actual MCP servers
4. **Error Handling** — Errors are caught and returned as string results, keeping the AI conversation flow intact

## Requirements

- **Node.js** 18+
- **ai** (Vercel AI SDK) >= 3.0.0
- An [Aerostack](https://aerostack.dev) workspace with a token (`mwt_...`)

## Getting Your Workspace Token

1. Sign up at [app.aerostack.dev](https://app.aerostack.dev)
2. Create a workspace and add MCP servers (GitHub, Slack, Notion, etc.)
3. Copy the workspace token (`mwt_...`) from the workspace settings

## Related Packages

| Package | Framework |
|---------|-----------|
| [`@aerostack/sdk-openai`](https://github.com/aerostackdev/sdk-openai) | OpenAI SDK |
| [`@aerostack/sdk-langchain`](https://github.com/aerostackdev/sdk-langchain) | LangChain.js |
| [`@aerostack/core`](https://github.com/aerostackdev/sdk-shared-core) | Core types + WorkspaceClient |

## Links

- [Aerostack Website](https://aerostack.dev)
- [Documentation](https://docs.aerostack.dev)
- [Dashboard](https://app.aerostack.dev)
- [MCP Marketplace](https://aerostack.dev/explore)
- [GitHub](https://github.com/aerostackdev)

## License

MIT
