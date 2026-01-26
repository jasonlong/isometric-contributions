#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const manifestPath = path.join(rootDir, 'src', 'manifest.json')

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

function writeManifest(manifest) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number)
  return { major, minor, patch }
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`
}

function bumpVersion(version, type) {
  const parsed = parseVersion(version)

  switch (type) {
    case 'major': {
      return formatVersion({ major: parsed.major + 1, minor: 0, patch: 0 })
    }

    case 'minor': {
      return formatVersion({
        major: parsed.major,
        minor: parsed.minor + 1,
        patch: 0
      })
    }

    case 'patch': {
      return formatVersion({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch + 1
      })
    }

    default: {
      throw new Error(`Unknown version type: ${type}`)
    }
  }
}

function getCurrentVersion() {
  const manifest = readManifest()
  return manifest.version
}

function setVersion(newVersion) {
  const manifest = readManifest()
  manifest.version = newVersion
  writeManifest(manifest)
  console.log(`Updated manifest.json to version ${newVersion}`)
}

const command = process.argv[2]

if (!command) {
  console.error('Usage: node scripts/version.js <get|patch|minor|major|set>')
  process.exit(1)
}

switch (command) {
  case 'get': {
    console.log(getCurrentVersion())
    break
  }

  case 'patch':
  case 'minor':
  case 'major': {
    const currentVersion = getCurrentVersion()
    const newVersion = bumpVersion(currentVersion, command)
    setVersion(newVersion)
    console.log(`\nVersion bumped: ${currentVersion} → ${newVersion}`)
    break
  }

  case 'set': {
    const version = process.argv[3]
    if (!version) {
      console.error('Usage: node scripts/version.js set <version>')
      process.exit(1)
    }

    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      console.error('Invalid version format. Expected: X.Y.Z')
      process.exit(1)
    }

    setVersion(version)
    break
  }

  default: {
    console.error(`Unknown command: ${command}`)
    console.error('Usage: node scripts/version.js <get|patch|minor|major|set>')
    process.exit(1)
  }
}
