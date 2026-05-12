import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const remoteLog = () => ({
  name: 'remote-log',
  configureServer(server: { middlewares: { use: (path: string, fn: (req: { method?: string }, res: { statusCode: number; end: () => void }, next: () => void) => void) => void } }) {
    server.middlewares.use('/__log', (req, res, next) => {
      if (req.method !== 'POST') return next()
      let body = ''
      ;(req as unknown as { on: (e: string, f: (c: Buffer) => void) => void; setEncoding: (e: string) => void }).setEncoding('utf8')
      ;(req as unknown as { on: (e: string, f: (c: string) => void) => void }).on('data', (c) => { body += c })
      ;(req as unknown as { on: (e: string, f: () => void) => void }).on('end', () => {
        process.stdout.write(`[REMOTE] ${body}\n`)
        res.statusCode = 204
        res.end()
      })
    })
  },
})

export default defineConfig({
  plugins: [react(), basicSsl(), remoteLog()],
  server: { host: true },
})
