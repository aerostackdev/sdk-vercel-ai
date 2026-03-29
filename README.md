# @aerostack/sdk-vercel-ai

Use [Aerostack](https://aerostack.dev) workspace tools with the [Vercel AI SDK](https://sdk.vercel.ai/).

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

## Factory Pattern

```typescript
import { createAerostackVercelAI } from '@aerostack/sdk-vercel-ai';

const aero = createAerostackVercelAI({ workspace: 'my-workspace', token: 'mwt_...' });
const { tools } = await aero.tools();
```

## API

### `getTools(config)` → `Promise<ToolSetResult>`

Fetches tools from the workspace. Each tool includes an `execute` function that calls the workspace gateway. Returns `{ tools, raw }`.

### `createAerostackVercelAI(config)` → `AerostackVercelAIClient`

Creates a reusable client that shares a single WorkspaceClient instance.

## Requirements

- `ai` >= 3.0.0
- An Aerostack workspace with a token (`mwt_...`)
