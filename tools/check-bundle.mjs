import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../dist/assets/', import.meta.url).pathname
const files = await readdir(root)
const js = await Promise.all(files.filter((file) => file.endsWith('.js')).map(async (file) => ({ file, bytes: (await stat(join(root, file))).size })))
const total = js.reduce((sum, item) => sum + item.bytes, 0)
const oversized = js.filter((item) => item.bytes > 2_500_000)
const audioRoot = new URL('../dist/audio/', import.meta.url).pathname
const audioFiles = []
const collectAudio = async (directory) => {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, file.name)
    if (file.isDirectory()) await collectAudio(path)
    else if (file.name.endsWith('.mp3')) audioFiles.push({ file: path, bytes: (await stat(path)).size })
  }
}
await collectAudio(audioRoot)
const audioTotal = audioFiles.reduce((sum, item) => sum + item.bytes, 0)
const oversizedAudio = audioFiles.filter((item) => item.bytes > 100_000)
if (oversized.length || total > 4_500_000 || oversizedAudio.length || audioTotal > 2_500_000) {
  console.error('Bundle budget exceeded', { total, oversized, audioTotal, oversizedAudio })
  process.exit(1)
}
console.log(`Bundle budget OK: ${(total / 1_000_000).toFixed(2)} MB JS + ${(audioTotal / 1_000_000).toFixed(2)} MB audio`)
