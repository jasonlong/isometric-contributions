#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const artifactsDir = path.join(rootDir, 'artifacts')
const zipPath = path.join(artifactsDir, 'isometric-contributions-edge.zip')

const API_BASE = 'https://api.addons.microsoftedge.microsoft.com/v1'

async function main() {
  const { EDGE_PRODUCT_ID, EDGE_CLIENT_ID, EDGE_API_KEY } = process.env

  if (!EDGE_PRODUCT_ID || !EDGE_CLIENT_ID || !EDGE_API_KEY) {
    console.error('Missing required Edge environment variables')
    console.error('Required: EDGE_PRODUCT_ID, EDGE_CLIENT_ID, EDGE_API_KEY')
    process.exit(1)
  }

  if (!fs.existsSync(zipPath)) {
    console.error(`Artifact not found: ${zipPath}`)
    console.error('Run "npm run build:edge" first')
    process.exit(1)
  }

  const headers = {
    Authorization: `ApiKey ${EDGE_API_KEY}`,
    'X-ClientID': EDGE_CLIENT_ID
  }

  // Step 1: Upload the package
  console.log('Uploading package to Edge Add-ons...')
  const zipBuffer = fs.readFileSync(zipPath)

  const uploadResponse = await fetch(`${API_BASE}/products/${EDGE_PRODUCT_ID}/submissions/draft/package`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/zip'
    },
    body: zipBuffer
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`)
  }

  const uploadOperationId = uploadResponse.headers.get('Location')
  console.log('Upload accepted, waiting for processing...')

  // Step 2: Poll for upload completion
  const uploadStatusUrl = `${API_BASE}/products/${EDGE_PRODUCT_ID}/submissions/draft/package/operations/${uploadOperationId}`
  await pollOperation(uploadStatusUrl, headers, 'Upload')

  // Step 3: Publish the submission
  console.log('Publishing update...')
  const publishResponse = await fetch(`${API_BASE}/products/${EDGE_PRODUCT_ID}/submissions`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notes: 'Automated submission via CI/CD' })
  })

  if (!publishResponse.ok) {
    const errorText = await publishResponse.text()
    throw new Error(`Publish failed (${publishResponse.status}): ${errorText}`)
  }

  const publishOperationId = publishResponse.headers.get('Location')
  console.log('Publish request accepted, waiting for completion...')

  // Step 4: Poll for publish completion
  const publishStatusUrl = `${API_BASE}/products/${EDGE_PRODUCT_ID}/submissions/operations/${publishOperationId}`
  await pollOperation(publishStatusUrl, headers, 'Publish')

  console.log('Edge submission complete!')
}

async function pollOperation(operationUrl, headers, operationName) {
  const maxAttempts = 60
  const pollInterval = 5000 // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(operationUrl, { headers })

    if (!response.ok) {
      // eslint-disable-next-line no-await-in-loop
      const errorText = await response.text()
      throw new Error(`${operationName} status check failed (${response.status}): ${errorText}`)
    }

    // eslint-disable-next-line no-await-in-loop
    const status = await response.json()
    console.log(`  ${operationName} status: ${status.status || status.state}`)

    if (status.status === 'Succeeded' || status.state === 'Succeeded') {
      return status
    }

    if (status.status === 'Failed' || status.state === 'Failed') {
      throw new Error(`${operationName} failed: ${JSON.stringify(status.errors || status.message)}`)
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, pollInterval)
    })
  }

  throw new Error(`${operationName} timed out after ${maxAttempts} attempts`)
}

main().catch((error) => {
  console.error('Edge submission failed:', error.message)
  process.exit(1)
})
