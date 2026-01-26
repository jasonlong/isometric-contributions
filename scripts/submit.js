#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const artifactsDir = path.join(rootDir, 'artifacts')

const dryRun = process.argv.includes('--dry-run')

function checkEnvVars(vars) {
  const missing = vars.filter((v) => !process.env[v])
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
    process.exit(1)
  }

  if (dryRun) {
    console.log(`  ✓ Environment variables present: ${vars.join(', ')}`)
  }
}

function checkArtifact(zipName) {
  const zipPath = path.join(artifactsDir, zipName)
  if (!fs.existsSync(zipPath)) {
    console.error(`Artifact not found: ${zipPath}`)
    console.error('Run "npm run build:all" first')
    process.exit(1)
  }

  if (dryRun) {
    console.log(`  ✓ Artifact exists: ${zipName}`)
  }

  return zipPath
}

async function submitChrome() {
  console.log('\n=== Chrome Web Store ===\n')

  checkEnvVars([
    'CHROME_EXTENSION_ID',
    'CHROME_CLIENT_ID',
    'CHROME_CLIENT_SECRET',
    'CHROME_REFRESH_TOKEN'
  ])
  const zipPath = checkArtifact('isometric-contributions-chrome.zip')

  if (dryRun) {
    console.log('  Validating credentials...')
    // Try to get an access token to validate credentials
    const tokenResult = execSync(
      `curl -s -X POST "https://oauth2.googleapis.com/token" \
        -d "client_id=${process.env.CHROME_CLIENT_ID}" \
        -d "client_secret=${process.env.CHROME_CLIENT_SECRET}" \
        -d "refresh_token=${process.env.CHROME_REFRESH_TOKEN}" \
        -d "grant_type=refresh_token"`,
      { encoding: 'utf8' }
    )
    const tokenData = JSON.parse(tokenResult)
    if (tokenData.access_token) {
      console.log('  ✓ Credentials valid (got access token)')
    } else {
      console.error(
        '  ✗ Invalid credentials:',
        tokenData.error_description || tokenData.error
      )
      process.exit(1)
    }

    console.log('\n  [DRY RUN] Would upload:', zipPath)
    return
  }

  const args = [
    'chrome-webstore-upload-cli',
    'upload',
    '--source',
    zipPath,
    '--extension-id',
    process.env.CHROME_EXTENSION_ID,
    '--client-id',
    process.env.CHROME_CLIENT_ID,
    '--client-secret',
    process.env.CHROME_CLIENT_SECRET,
    '--refresh-token',
    process.env.CHROME_REFRESH_TOKEN,
    '--auto-publish'
  ]

  execSync(`npx ${args.join(' ')}`, {
    cwd: rootDir,
    stdio: 'inherit'
  })

  console.log('\n✓ Chrome Web Store submission complete\n')
}

async function submitFirefox() {
  console.log('\n=== Firefox Add-ons ===\n')

  checkEnvVars(['AMO_API_KEY', 'AMO_API_SECRET'])
  checkArtifact('isometric-contributions-firefox.zip')

  if (dryRun) {
    console.log('  Validating credentials...')
    // Web-ext doesn't have a validate-only mode, but we can check the JWT format
    const apiKey = process.env.AMO_API_KEY
    const apiSecret = process.env.AMO_API_SECRET
    if (apiKey?.startsWith('user:') && apiSecret && apiSecret.length > 20) {
      console.log('  ✓ Credentials format looks valid')
    } else {
      console.log(
        '  ⚠ Credentials format may be incorrect (expected JWT issuer starting with "user:")'
      )
    }

    console.log('\n  [DRY RUN] Would submit to Firefox Add-ons')
    return
  }

  const args = [
    'web-ext',
    'sign',
    '--channel',
    'listed',
    '--source-dir',
    path.join(rootDir, 'dist'),
    '--artifacts-dir',
    artifactsDir,
    '--api-key',
    process.env.AMO_API_KEY,
    '--api-secret',
    process.env.AMO_API_SECRET
  ]

  execSync(`npx ${args.join(' ')}`, {
    cwd: rootDir,
    stdio: 'inherit'
  })

  console.log('\n✓ Firefox Add-ons submission complete\n')
}

async function submitEdge() {
  console.log('\n=== Microsoft Edge Add-ons ===\n')

  checkEnvVars(['EDGE_PRODUCT_ID', 'EDGE_CLIENT_ID', 'EDGE_API_KEY'])
  const zipPath = checkArtifact('isometric-contributions-edge.zip')

  if (dryRun) {
    console.log('  Validating credentials (v1.1 API)...')
    // Test the v1.1 API by checking the current draft submission
    const result = execSync(
      `curl -s -w "\\n%{http_code}" \
        -H "Authorization: ApiKey ${process.env.EDGE_API_KEY}" \
        -H "X-ClientID: ${process.env.EDGE_CLIENT_ID}" \
        "https://api.addons.microsoftedge.microsoft.com/v1/products/${process.env.EDGE_PRODUCT_ID}/submissions/draft/package"`,
      { encoding: 'utf8' }
    )
    const lines = result.trim().split('\n')
    const httpCode = lines.pop()
    const body = lines.join('\n')

    // 200 = has draft, 404 = no draft (both are valid), 401/403 = auth error
    if (httpCode === '200' || httpCode === '404') {
      console.log(`  ✓ Credentials valid (HTTP ${httpCode})`)
    } else {
      console.error(`  ✗ API request failed (HTTP ${httpCode}):`, body)
      process.exit(1)
    }

    console.log('\n  [DRY RUN] Would upload:', zipPath)
    return
  }

  execSync('node scripts/submit-edge.js', {
    cwd: rootDir,
    stdio: 'inherit'
  })

  console.log('\n✓ Edge Add-ons submission complete\n')
}

async function submitAll() {
  await submitChrome()
  await submitFirefox()
  await submitEdge()
  if (dryRun) {
    console.log('\n=== Dry run complete - all checks passed ===\n')
  } else {
    console.log('=== All submissions complete ===\n')
  }
}

const target = process.argv.slice(2).find((a) => !a.startsWith('--'))

if (!target) {
  console.error(
    'Usage: node scripts/submit.js <chrome|firefox|edge|all> [--dry-run]'
  )
  process.exit(1)
}

const handlers = {
  chrome: submitChrome,
  firefox: submitFirefox,
  edge: submitEdge,
  all: submitAll
}

if (!handlers[target]) {
  console.error(`Unknown target: ${target}`)
  console.error(
    'Usage: node scripts/submit.js <chrome|firefox|edge|all> [--dry-run]'
  )
  process.exit(1)
}

if (dryRun) {
  console.log('🧪 DRY RUN MODE - validating without publishing\n')
}

handlers[target]().catch((error) => {
  console.error('Submission failed:', error.message)
  process.exit(1)
})
