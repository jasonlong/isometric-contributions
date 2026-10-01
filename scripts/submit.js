#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHmac, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const artifactsDir = path.join(rootDir, 'artifacts')

const dryRun = process.argv.includes('--dry-run')
const EXTENSION_NAME = 'Isometric Contributions'
const CHROME_PUBLISHER_ID = '5fed62bc-275d-47ee-8e18-802157d2bb1d'
const FIREFOX_ADDON_SLUG = 'github-isometric-contributions'

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

function createMozillaJwt(apiKey, apiSecret) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const unsignedToken = [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      iss: apiKey,
      jti: randomUUID(),
      iat: issuedAt,
      exp: issuedAt + 60
    })
  ].join('.')
  const signature = createHmac('sha256', apiSecret)
    .update(unsignedToken)
    .digest('base64url')

  return `${unsignedToken}.${signature}`
}

async function updateFirefoxListingName() {
  console.log(`Updating Firefox listing name to "${EXTENSION_NAME}"...`)
  const token = createMozillaJwt(
    process.env.AMO_API_KEY,
    process.env.AMO_API_SECRET
  )
  const response = await fetch(
    `https://addons.mozilla.org/api/v5/addons/addon/${FIREFOX_ADDON_SLUG}/`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `JWT ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: { 'en-US': EXTENSION_NAME } })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Firefox listing update failed (${response.status}): ${errorText}`
    )
  }

  const updatedListing = await response.json()
  const updatedName = updatedListing.name?.['en-US']
  if (updatedName !== EXTENSION_NAME) {
    throw new Error(
      `Firefox returned an unexpected listing name: ${updatedName || 'missing'}`
    )
  }

  console.log('✓ Firefox listing name updated')
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
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.CHROME_CLIENT_ID,
        client_secret: process.env.CHROME_CLIENT_SECRET,
        refresh_token: process.env.CHROME_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    })
    const tokenData = await tokenResponse.json()
    if (tokenResponse.ok && tokenData.access_token) {
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

  const args = ['chrome-webstore-upload-cli', '--source', zipPath]

  try {
    execFileSync('npx', args, {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        EXTENSION_ID: process.env.CHROME_EXTENSION_ID,
        PUBLISHER_ID: CHROME_PUBLISHER_ID,
        CLIENT_ID: process.env.CHROME_CLIENT_ID,
        CLIENT_SECRET: process.env.CHROME_CLIENT_SECRET,
        REFRESH_TOKEN: process.env.CHROME_REFRESH_TOKEN
      }
    })
  } catch (error) {
    if (error.message?.includes('PKG_INVALID_VERSION_NUMBER')) {
      console.log(
        '\n⚠ Version already published to Chrome Web Store — skipping\n'
      )
      return
    }

    throw error
  }

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
    artifactsDir
  ]

  try {
    execFileSync('npx', args, {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        WEB_EXT_API_KEY: process.env.AMO_API_KEY,
        WEB_EXT_API_SECRET: process.env.AMO_API_SECRET
      }
    })
  } catch (error) {
    if (error.message?.includes('Version already exists')) {
      console.log(
        '\n⚠ Version already published to Firefox Add-ons — skipping\n'
      )
    } else {
      throw error
    }
  }

  await updateFirefoxListingName()
  console.log('\n✓ Firefox Add-ons submission complete\n')
}

async function updateFirefoxMetadata() {
  console.log('\n=== Firefox Add-ons Metadata ===\n')
  checkEnvVars(['AMO_API_KEY', 'AMO_API_SECRET'])

  if (dryRun) {
    console.log(`  [DRY RUN] Would set listing name to "${EXTENSION_NAME}"`)
    return
  }

  await updateFirefoxListingName()
  console.log('\n✓ Firefox Add-ons metadata update complete\n')
}

async function submitEdge() {
  console.log('\n=== Microsoft Edge Add-ons ===\n')

  checkEnvVars(['EDGE_PRODUCT_ID', 'EDGE_CLIENT_ID', 'EDGE_API_KEY'])
  const zipPath = checkArtifact('isometric-contributions-edge.zip')

  if (dryRun) {
    console.log(
      '  ✓ Credentials present (Edge validates them during package upload)'
    )

    console.log('\n  [DRY RUN] Would upload:', zipPath)
    return
  }

  execFileSync(process.execPath, ['scripts/submit-edge.js'], {
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
    'Usage: node scripts/submit.js <chrome|firefox|firefox-metadata|edge|all> [--dry-run]'
  )
  process.exit(1)
}

const handlers = {
  chrome: submitChrome,
  firefox: submitFirefox,
  'firefox-metadata': updateFirefoxMetadata,
  edge: submitEdge,
  all: submitAll
}

if (!handlers[target]) {
  console.error(`Unknown target: ${target}`)
  console.error(
    'Usage: node scripts/submit.js <chrome|firefox|firefox-metadata|edge|all> [--dry-run]'
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
