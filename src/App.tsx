import { useRef, useState } from 'react'
import { useConversation, useConversationClientTool } from '@elevenlabs/react'
import { Conversation } from '@elevenlabs/client'

// ⚠️ Replace with your agent ID to test
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined

/**
 * Minimal reproduction of @elevenlabs/react ConversationProvider being
 * broken on iOS Safari 18+.
 *
 * This page shows two panels side-by-side:
 *
 * LEFT: Uses ConversationProvider + useConversation + useConversationClientTool
 *       → Broken on iOS Safari (status stuck at disconnected, tools don't fire)
 *
 * RIGHT: Uses Conversation.startSession() from @elevenlabs/client directly
 *        → Works perfectly on the same device
 *
 * Both use the same agent ID. On desktop browsers, both panels work.
 * On iOS Safari 18.7, only the right panel works.
 */
export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18 }}>ElevenLabs iOS Safari Repro</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        Testing <b>@elevenlabs/react@1.6.0</b> (includes PR #672 ConversationProvider lifecycle fix).
        Left panel uses ConversationProvider.
        Right panel uses Conversation.startSession directly.
      </p>
      {!AGENT_ID && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          Set VITE_ELEVENLABS_AGENT_ID in .env to test
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <ProviderPanel />
        <DirectPanel />
      </div>
      <LogPanel />
    </div>
  )
}

// ─── LEFT PANEL: ConversationProvider (broken on iOS) ───────────────

function ProviderPanel() {
  const conversation = useConversation({
    onConnect: () => addLog('provider', 'onConnect'),
    onDisconnect: () => addLog('provider', 'onDisconnect'),
    onError: (err: unknown) => addLog('provider', `onError: ${err}`),
    onStatusChange: (s: unknown) => addLog('provider', `onStatusChange: ${JSON.stringify(s)}`),
    onModeChange: (m: unknown) => addLog('provider', `onModeChange: ${JSON.stringify(m)}`),
    onMessage: (m: unknown) => {
      const msg = m as { source?: string; message?: string }
      addLog('provider', `onMessage: [${msg.source}] ${(msg.message ?? '').slice(0, 60)}`)
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  useConversationClientTool('test_tool', (params) => {
    addLog('provider', `✅ test_tool CALLED: ${JSON.stringify(params)}`)
    return 'Tool executed successfully'
  })
  useConversationClientTool('navigate_to_planet', (params) => {
    addLog('provider', `✅ navigate_to_planet CALLED: ${JSON.stringify(params)}`)
    return 'Navigated successfully'
  })
  useConversationClientTool('navigate_to_moon', (params) => {
    addLog('provider', `✅ navigate_to_moon CALLED: ${JSON.stringify(params)}`)
    return 'Navigated successfully'
  })
  useConversationClientTool('navigate_to_sun', (params) => {
    addLog('provider', `✅ navigate_to_sun CALLED: ${JSON.stringify(params)}`)
    return 'Navigated successfully'
  })
  useConversationClientTool('go_back', (params) => {
    addLog('provider', `✅ go_back CALLED: ${JSON.stringify(params)}`)
    return 'Navigated successfully'
  })

  const toggle = async () => {
    if (!AGENT_ID) return
    if (conversation.status === 'connected') {
      conversation.endSession()
    } else {
      addLog('provider', 'priming mic via getUserMedia...')
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        addLog('provider', 'mic primed')
      } catch (e) {
        addLog('provider', `getUserMedia failed: ${e}`)
      }
      addLog('provider', 'calling startSession...')
      await conversation.startSession({ agentId: AGENT_ID, connectionType: 'websocket' })
      addLog('provider', 'startSession returned')
    }
  }

  return (
    <div style={{ border: '2px solid #e74c3c', borderRadius: 8, padding: 16 }}>
      <h2 style={{ fontSize: 14, color: '#e74c3c', margin: '0 0 12px' }}>
        ❌ ConversationProvider
      </h2>
      <div style={{ fontSize: 13, marginBottom: 12 }}>
        <div>Status: <b>{conversation.status}</b></div>
        <div>Speaking: <b>{String(conversation.isSpeaking)}</b></div>
      </div>
      <button
        onClick={toggle}
        disabled={!AGENT_ID}
        style={{ padding: '8px 16px', fontSize: 14 }}
      >
        {conversation.status === 'connected' ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

// ─── RIGHT PANEL: Direct Conversation.startSession (works on iOS) ──

function DirectPanel() {
  const convRef = useRef<Conversation | null>(null)
  const [status, setStatus] = useState<string>('disconnected')
  const [speaking, setSpeaking] = useState(false)

  const toggle = async () => {
    if (!AGENT_ID) return
    if (convRef.current) {
      await convRef.current.endSession()
      convRef.current = null
      setStatus('disconnected')
      setSpeaking(false)
      return
    }

    setStatus('connecting')
    addLog('direct', 'priming mic via getUserMedia...')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      addLog('direct', 'mic primed')
    } catch (e) {
      addLog('direct', `getUserMedia failed: ${e}`)
    }
    addLog('direct', 'calling Conversation.startSession...')

    try {
      const conv = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
        clientTools: {
          test_tool: (params: unknown) => {
            addLog('direct', `✅ test_tool CALLED: ${JSON.stringify(params)}`)
            return 'Tool executed successfully'
          },
          navigate_to_planet: (params: unknown) => {
            addLog('direct', `✅ navigate_to_planet CALLED: ${JSON.stringify(params)}`)
            return 'Navigated successfully'
          },
          navigate_to_moon: (params: unknown) => {
            addLog('direct', `✅ navigate_to_moon CALLED: ${JSON.stringify(params)}`)
            return 'Navigated successfully'
          },
          navigate_to_sun: (params: unknown) => {
            addLog('direct', `✅ navigate_to_sun CALLED: ${JSON.stringify(params)}`)
            return 'Navigated successfully'
          },
          go_back: (params: unknown) => {
            addLog('direct', `✅ go_back CALLED: ${JSON.stringify(params)}`)
            return 'Navigated successfully'
          },
        },
        onConnect: () => { setStatus('connected'); addLog('direct', 'onConnect') },
        onDisconnect: () => { setStatus('disconnected'); setSpeaking(false); convRef.current = null; addLog('direct', 'onDisconnect') },
        onError: (err: unknown) => addLog('direct', `onError: ${err}`),
        onStatusChange: (s: { status: string }) => addLog('direct', `onStatusChange: ${JSON.stringify(s)}`),
        onModeChange: (m: { mode: string }) => { setSpeaking(m.mode === 'speaking'); addLog('direct', `onModeChange: ${JSON.stringify(m)}`) },
        onMessage: (m: unknown) => {
          const msg = m as { source?: string; message?: string }
          addLog('direct', `onMessage: [${msg.source}] ${(msg.message ?? '').slice(0, 60)}`)
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      convRef.current = conv
      addLog('direct', 'startSession resolved')
    } catch (err) {
      setStatus('disconnected')
      addLog('direct', `startSession REJECTED: ${err}`)
    }
  }

  return (
    <div style={{ border: '2px solid #27ae60', borderRadius: 8, padding: 16 }}>
      <h2 style={{ fontSize: 14, color: '#27ae60', margin: '0 0 12px' }}>
        ✅ Direct Conversation
      </h2>
      <div style={{ fontSize: 13, marginBottom: 12 }}>
        <div>Status: <b>{status}</b></div>
        <div>Speaking: <b>{String(speaking)}</b></div>
      </div>
      <button
        onClick={toggle}
        disabled={!AGENT_ID}
        style={{ padding: '8px 16px', fontSize: 14 }}
      >
        {convRef.current ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

// ─── LOG PANEL ──────────────────────────────────────────────────────

const logs: { time: number; source: string; msg: string }[] = []
let logListeners: (() => void)[] = []

function addLog(source: string, msg: string) {
  logs.push({ time: Date.now(), source, msg })
  if (logs.length > 200) logs.shift()
  logListeners.forEach(fn => fn())
  console.log(`[${source}] ${msg}`)
  fetch('/__log', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: `[${source}] ${msg}`,
    keepalive: true,
  }).catch(() => {})
}

function LogPanel() {
  const [, forceUpdate] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useState(() => {
    const listener = () => {
      forceUpdate(n => n + 1)
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 0)
    }
    logListeners.push(listener)
  })

  const t0 = logs[0]?.time ?? Date.now()

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>Event Log</h2>
      <div
        ref={scrollRef}
        style={{
          height: 300,
          overflow: 'auto',
          background: '#1a1a2e',
          color: '#eee',
          fontFamily: 'monospace',
          fontSize: 11,
          padding: 8,
          borderRadius: 8,
        }}
      >
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.source === 'provider' ? '#e74c3c' : '#27ae60' }}>
            <span style={{ color: '#888' }}>+{((l.time - t0) / 1000).toFixed(1)}s</span>{' '}
            [{l.source}] {l.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
