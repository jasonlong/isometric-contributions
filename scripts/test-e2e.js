#!/usr/bin/env node

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const TTY_WARNING = 'Opening `/dev/tty` failed'

const pipeWithFilter = (stream, target) => {
  let buffer = ''
  stream.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
    let newlineIndex = buffer.indexOf('\n')
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex + 1)
      buffer = buffer.slice(newlineIndex + 1)
      const lineWithoutEnding = line.replace(/\r?\n$/, '')
      if (!lineWithoutEnding.includes(TTY_WARNING)) {
        target.write(line)
      }
      newlineIndex = buffer.indexOf('\n')
    }
  })
  stream.on('end', () => {
    if (buffer && !buffer.includes(TTY_WARNING)) {
      target.write(buffer)
    }
  })
}

const run = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe']
    })

    pipeWithFilter(child.stdout, process.stdout)
    pipeWithFilter(child.stderr, process.stderr)

    child.on('error', reject)
    child.on('close', (code) => resolve(code ?? 1))
  })
}

const main = async () => {
  const buildCode = await run('npm', ['run', 'build:chrome'])
  if (buildCode !== 0) {
    process.exit(buildCode)
  }

  const testCode = await run(process.execPath, ['test-extension.js'])
  process.exit(testCode)
}

main().catch((error) => {
  console.error('E2E test failed:', error.message)
  process.exit(1)
})
