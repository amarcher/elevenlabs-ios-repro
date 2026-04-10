# ElevenLabs iOS Safari Reproduction

Minimal reproduction for [elevenlabs/packages#663](https://github.com/elevenlabs/packages/issues/663):
`@elevenlabs/react` ConversationProvider is broken on iOS Safari 18+.

## The Bug

Two panels side-by-side, same agent:

- **Left**: Uses `ConversationProvider` + `useConversation` + `useConversationClientTool` → **Broken on iOS Safari** (status stuck at disconnected, tools don't fire)
- **Right**: Uses `Conversation.startSession()` from `@elevenlabs/client` directly → **Works on iOS Safari**

On desktop browsers, both panels work identically.

## Setup

```bash
npm install
echo "VITE_ELEVENLABS_AGENT_ID=your-agent-id" > .env
npm run dev
```

For iOS testing, deploy to a public URL (e.g. Vercel):

```bash
npx vercel
```

Then open the Vercel URL on your iPhone in Safari.

## What to observe on iOS Safari

1. Tap "Start" on the **left panel** (ConversationProvider)
   - Status stays "disconnected" even though the agent connects and speaks
   - `isSpeaking` never updates
   - If the agent calls `test_tool`, you'll see `"Client tool not defined"` in the console

2. Tap "Start" on the **right panel** (direct Conversation)
   - Status correctly shows "connected"
   - `isSpeaking` toggles as the agent speaks
   - Tool calls fire correctly with green `✅ test_tool CALLED` logs

The event log at the bottom shows the SDK callbacks for both panels, making the difference visible in real-time.
