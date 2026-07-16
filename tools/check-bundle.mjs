import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../dist/assets/', import.meta.url).pathname
const files = await readdir(root)
const js = await Promise.all(files.filter((file) => file.endsWith('.js')).map(async (file) => ({ file, bytes: (await stat(join(root, file))).size })))
const total = js.reduce((sum, item) => sum + item.bytes, 0)
const oversized = js.filter((item) => item.bytes > 2_500_000)
if (oversized.length || total > 4_500_000) {
  console.error('Bundle budget exceeded', { total, oversized })
  process.exit(1)
}
console.log(`Bundle budget OK: ${(total / 1_000_000).toFixed(2)} MB across ${js.length} chunks`)
