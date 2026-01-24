#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { EdgeAddonsAPI } from '@plasmohq/edge-addons-api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const artifactsDir = path.join(rootDir, 'artifacts')
const zipPath = path.join(artifactsDir, 'isometric-contributions-edge.zip')

async function main() {
  const { EDGE_PRODUCT_ID, EDGE_CLIENT_ID, EDGE_CLIENT_SECRET, EDGE_ACCESS_TOKEN_URL } = process.env

  if (!EDGE_PRODUCT_ID || !EDGE_CLIENT_ID || !EDGE_CLIENT_SECRET || !EDGE_ACCESS_TOKEN_URL) {
    console.error('Missing required Edge environment variables')
    process.exit(1)
  }

  if (!fs.existsSync(zipPath)) {
    console.error(`Artifact not found: ${zipPath}`)
    console.error('Run "npm run build:edge" first')
    process.exit(1)
  }

  const api = new EdgeAddonsAPI({
    productId: EDGE_PRODUCT_ID,
    clientId: EDGE_CLIENT_ID,
    clientSecret: EDGE_CLIENT_SECRET,
    accessTokenUrl: EDGE_ACCESS_TOKEN_URL
  })

  console.log('Uploading package to Edge Add-ons...')
  const uploadResult = await api.upload(zipPath)
  console.log('Upload result:', uploadResult)

  console.log('Publishing update...')
  const publishResult = await api.publish()
  console.log('Publish result:', publishResult)
}

main().catch((error) => {
  console.error('Edge submission failed:', error)
  process.exit(1)
})
