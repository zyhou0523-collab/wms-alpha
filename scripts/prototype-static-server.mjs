import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

function argValue(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const port = Number(argValue('--port', process.env.WMS_ALPHA_PORT || '5174'))
const host = argValue('--host', process.env.WMS_ALPHA_HOST || '127.0.0.1')
const distRoot = path.resolve(argValue('--root', process.env.WMS_ALPHA_DIST || path.join(projectRoot, 'frontend', 'dist')))

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

async function resolveFile(requestPath) {
  const pathname = requestPath === '/' ? '/dashboard' : decodeURIComponent(requestPath)
  const requested = path.normalize(path.join(distRoot, pathname))
  const safeRoot = path.normalize(distRoot)

  if (!requested.startsWith(safeRoot)) {
    return path.join(distRoot, 'index.html')
  }

  try {
    const fileStat = await stat(requested)
    if (fileStat.isFile()) return requested
  } catch {
    // SPA routes fall through to index.html.
  }

  return path.join(distRoot, 'index.html')
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${host}:${port}`)
    const filePath = await resolveFile(url.pathname)
    const ext = path.extname(filePath).toLowerCase()
    const body = await readFile(filePath)

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    res.end(body)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(String(error?.stack || error))
  }
})

server.listen(port, host, () => {
  console.log(`WMS Alpha prototype server running at http://${host}:${port}`)
  console.log(`Serving dist from ${distRoot}`)
})
