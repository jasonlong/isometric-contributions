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

async function cancelPendingSubmission(productId, headers) {
  // Check for any in-review submissions
  console.log('Checking for pending submissions...')

  const response = await fetch(
    `${API_BASE}/products/${productId}/submissions`,
    { headers }
  )

  if (!response.ok) {
    // 404 means no submissions, which is fine
    if (response.status === 404) {
      console.log('No pending submissions found')
      return
    }
    const errorText = await response.text()
    console.warn(
      `Could not check submissions (${response.status}): ${errorText}`
    )
    return
  }

  const submissions = await response.json()

  // Find any submission that's in review or pending
  const pendingStates = ['InReview', 'Submitted', 'InProgress']
  const pending = submissions.find((s) => pendingStates.includes(s.status))

  if (!pending) {
    console.log('No pending submissions to cancel')
    return
  }

  console.log(
    `Found pending submission (${pending.id}) with status: ${pending.status}`
  )
  console.log('Canceling pending submission...')

  const cancelResponse = await fetch(
    `${API_BASE}/products/${productId}/submissions/${pending.id}`,
    {
      method: 'DELETE',
      headers
    }
  )

  if (!cancelResponse.ok) {
    const errorText = await cancelResponse.text()
    throw new Error(
      `Failed to cancel submission (${cancelResponse.status}): ${errorText}`
    )
  }

  console.log('Pending submission canceled successfully')
}

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

  // Step 0: Cancel any pending submissions
  await cancelPendingSubmission(EDGE_PRODUCT_ID, headers)

  // Step 1: Upload the package
  console.log('Uploading package to Edge Add-ons...')
  const zipBuffer = fs.readFileSync(zipPath)

  const uploadResponse = await fetch(
    `${API_BASE}/products/${EDGE_PRODUCT_ID}/submissions/draft/package`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/zip'
      },
      body: zipBuffer
    }
  )

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
  const publishResponse = await fetch(
    `${API_BASE}/products/${EDGE_PRODUCT_ID}/submissions`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes: 'Automated submission via CI/CD' })
    }
  )

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
      throw new Error(
        `${operationName} status check failed (${response.status}): ${errorText}`
      )
    }

    // eslint-disable-next-line no-await-in-loop
    const status = await response.json()
    console.log(`  ${operationName} status: ${status.status || status.state}`)

    if (status.status === 'Succeeded' || status.state === 'Succeeded') {
      return status
    }

    if (status.status === 'Failed' || status.state === 'Failed') {
      throw new Error(
        `${operationName} failed: ${JSON.stringify(status.errors || status.message)}`
      )
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
