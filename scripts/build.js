#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const artifactsDir = path.join(rootDir, 'artifacts')

const FIREFOX_ADDON_ID = 'isometric-contributions@jasonlong.me'

const browsers = {
  chrome: { zipName: 'isometric-contributions-chrome.zip' },
  edge: { zipName: 'isometric-contributions-edge.zip' },
  firefox: { zipName: 'isometric-contributions-firefox.zip' }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true })
  }

  fs.mkdirSync(dir, { recursive: true })
}

function transformForFirefox(manifest) {
  const v2 = { ...manifest }

  // Change to manifest v2
  // eslint-disable-next-line camelcase
  v2.manifest_version = 2

  // Move host_permissions into permissions (v2 doesn't have host_permissions)
  if (v2.host_permissions) {
    v2.permissions = [...(v2.permissions || []), ...v2.host_permissions]
    delete v2.host_permissions
  }

  // Add Firefox-specific settings
  // eslint-disable-next-line camelcase
  v2.browser_specific_settings = {
    gecko: { id: FIREFOX_ADDON_ID }
  }

  return v2
}

function writeDistManifest(manifest) {
  const distManifestPath = path.join(distDir, 'manifest.json')
  fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2) + '\n')
}

function runParcelBuild() {
  console.log('Running Parcel build...')
  execSync('npx parcel build src/manifest.json', {
    cwd: rootDir,
    stdio: 'inherit'
  })
}

function createZip(browser) {
  const config = browsers[browser]
  const zipPath = path.join(artifactsDir, config.zipName)

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath)
  }

  console.log(`Creating ${config.zipName}...`)
  execSync(`zip -r "${zipPath}" .`, {
    cwd: distDir,
    stdio: 'inherit'
  })

  const stats = fs.statSync(zipPath)
  console.log(`Created ${config.zipName} (${(stats.size / 1024).toFixed(1)} KB)`)
}

function build(browser) {
  console.log(`\n=== Building for ${browser} ===\n`)

  cleanDir(distDir)
  ensureDir(artifactsDir)

  // Build with Parcel (uses v3 manifest)
  runParcelBuild()

  // For Firefox, transform the manifest in dist/
  if (browser === 'firefox') {
    console.log('Transforming manifest for Firefox (v3 → v2)...')
    const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'))
    const v2Manifest = transformForFirefox(manifest)
    writeDistManifest(v2Manifest)
  }

  createZip(browser)

  console.log(`\n✓ ${browser} build complete\n`)
}

function buildAll() {
  for (const browser of Object.keys(browsers)) {
    build(browser)
  }

  console.log('=== All builds complete ===\n')
  console.log('Artifacts:')
  for (const browser of Object.keys(browsers)) {
    const config = browsers[browser]
    const zipPath = path.join(artifactsDir, config.zipName)
    if (fs.existsSync(zipPath)) {
      const stats = fs.statSync(zipPath)
      console.log(`  ${config.zipName} (${(stats.size / 1024).toFixed(1)} KB)`)
    }
  }
}

const target = process.argv[2]

if (!target) {
  console.error('Usage: node scripts/build.js <chrome|edge|firefox|all>')
  process.exit(1)
}

if (target === 'all') {
  buildAll()
} else if (browsers[target]) {
  build(target)
} else {
  console.error(`Unknown target: ${target}`)
  console.error('Usage: node scripts/build.js <chrome|edge|firefox|all>')
  process.exit(1)
}
