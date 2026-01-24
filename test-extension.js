import puppeteer from 'puppeteer'
import path from 'node:path'
import process from 'node:process'

const validateNumberIsPositive = (number) => {
  const value = Number.parseInt(number.replaceAll(',', ''), 10)
  if (value <= 0) {
    throw new Error(`Invalid contribution total: ${number}`)
  }

  return value
}

const run = async () => {
  console.log('Starting extension health check...')

  const pathToExtension = path.join(process.cwd(), 'dist')
  console.log('Extension path:', pathToExtension)

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--disable-extensions-except=' + pathToExtension,
      '--load-extension=' + pathToExtension,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  try {
    const page = await browser.newPage()

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message))

    await page.setViewport({ width: 1280, height: 1024 })

    console.log('Navigating to GitHub profile...')
    await page.goto('https://github.com/jasonlong', {
      waitUntil: 'networkidle2',
      timeout: 30_000,
    })

    console.log('Waiting for extension to inject UI...')
    await page.waitForSelector('[data-ic-option="cubes"]', {
      visible: true,
      timeout: 10_000,
    })

    console.log('Clicking 3D toggle...')
    await page.click('[data-ic-option="cubes"]')

    // Give the 3D render a moment to complete
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log('Checking canvas is rendered...')
    const canvasDrawn = await page.evaluate(() => {
      const canvas = document.querySelector('#isometric-contributions')
      if (!canvas) return { exists: false }
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let nonTransparentPixels = 0
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) nonTransparentPixels++
      }

      return {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        nonTransparentPixels,
      }
    })

    if (!canvasDrawn.exists) {
      throw new Error('Canvas element #isometric-contributions not found')
    }

    if (canvasDrawn.nonTransparentPixels === 0) {
      throw new Error('Canvas exists but nothing was drawn on it')
    }

    console.log(
      `Canvas rendered: ${canvasDrawn.width}x${canvasDrawn.height} with ${canvasDrawn.nonTransparentPixels.toLocaleString()} drawn pixels`,
    )

    console.log('Checking contribution data...')
    const contribTotal = await page.$eval(
      '.ic-contributions-wrapper ::-p-text(Contributions) + div ::-p-text(Total)',
      (el) => el.previousElementSibling.textContent,
    )

    const validatedTotal = validateNumberIsPositive(contribTotal.toString())

    console.log('Extension working correctly!')
    console.log('Contribution total:', validatedTotal.toLocaleString())

    await browser.close()
    process.exit(0)
  } catch (error) {
    console.error('Extension check failed:', error.message)

    try {
      const page = (await browser.pages())[0]
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
      console.log('Error screenshot saved to error-screenshot.png')
    } catch {
      console.log('Could not capture screenshot')
    }

    await browser.close()
    process.exit(1)
  }
}

run()
