import path from 'node:path'
import process from 'node:process'
import puppeteer from 'puppeteer'

const filterTtyWarning = (stream) => {
  const originalWrite = stream.write.bind(stream)
  stream.write = (chunk, encoding, callback) => {
    const message = typeof chunk === 'string' ? chunk : chunk?.toString?.()
    if (message?.includes('Opening `/dev/tty` failed')) {
      return true
    }

    return originalWrite(chunk, encoding, callback)
  }
}

filterTtyWarning(process.stderr)
filterTtyWarning(process.stdout)

const validateNumberIsNonNegative = (number) => {
  const value = Number.parseInt(number.replaceAll(',', ''), 10)
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid contribution total: ${number}`)
  }

  return value
}

const validateContributionTotal = (total, { min = 0, max = Infinity } = {}) => {
  if (total < min || total > max) {
    throw new Error(`Contribution total out of range: ${total}`)
  }
}

const run = async () => {
  console.log('Starting extension health check...')

  const pathToExtension = path.join(process.cwd(), 'dist')
  console.log('Extension path:', pathToExtension)

  const browser = await puppeteer.launch({
    headless: 'new',
    pipe: true,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--disable-logging',
      '--log-level=3',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  })

  try {
    const page = await browser.newPage()

    page.on('console', (message) => console.log('PAGE LOG:', message.text()))
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message))

    await page.setViewport({ width: 1280, height: 1024 })

    const profiles = [
      {
        url: 'https://github.com/dork',
        expectedBestDay: 'No activity found',
        totalRange: { min: 0, max: 0 }
      },
      {
        url: 'https://github.com/jasonlong',
        expectedBestDay: 'has-activity',
        totalRange: { min: 1 }
      }
    ]

    for (const profile of profiles) {
      console.log(`Navigating to GitHub profile: ${profile.url}`)
      await page.goto(profile.url, {
        waitUntil: 'networkidle2',
        timeout: 30_000
      })

      console.log('Waiting for extension to inject UI...')
      await page.waitForSelector('[data-ic-option="cubes"]', {
        visible: true,
        timeout: 10_000
      })

      console.log('Clicking 3D toggle...')
      await page.click('[data-ic-option="cubes"]')

      // Give the 3D render a moment to complete
      await new Promise((resolve) => {
        setTimeout(resolve, 2000)
      })

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
          nonTransparentPixels
        }
      })

      if (!canvasDrawn.exists) {
        throw new Error('Canvas element #isometric-contributions not found')
      }

      if (canvasDrawn.nonTransparentPixels === 0) {
        throw new Error('Canvas exists but nothing was drawn on it')
      }

      console.log(
        `Canvas rendered: ${canvasDrawn.width}x${canvasDrawn.height} with ${canvasDrawn.nonTransparentPixels.toLocaleString()} drawn pixels`
      )

      console.log('Checking that 2D graph is hidden in 3D mode...')
      const graphVisibility = await page.evaluate(() => {
        const calendarGraph = document.querySelector('.js-calendar-graph')
        if (!calendarGraph) return { exists: false }
        const style = window.getComputedStyle(calendarGraph)
        return {
          exists: true,
          display: style.display,
          visibility: style.visibility,
          isHidden: style.display === 'none'
        }
      })

      if (!graphVisibility.exists) {
        throw new Error('Could not find .js-calendar-graph element')
      }

      if (!graphVisibility.isHidden) {
        throw new Error(
          `2D graph should be hidden in 3D mode but has display: "${graphVisibility.display}"`
        )
      }

      console.log('2D graph correctly hidden in 3D mode')

      // Test 2D mode
      console.log('Clicking 2D toggle...')
      await page.click('[data-ic-option="squares"]')
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mode2D = await page.evaluate(() => {
        const canvas = document.querySelector('#isometric-contributions')
        const calendarGraph = document.querySelector('.js-calendar-graph')
        const canvasStyle = window.getComputedStyle(canvas)
        const graphStyle = window.getComputedStyle(calendarGraph)
        return {
          canvasHidden: canvasStyle.display === 'none',
          graphVisible: graphStyle.display !== 'none'
        }
      })

      if (!mode2D.canvasHidden) {
        throw new Error('3D canvas should be hidden in 2D mode')
      }
      if (!mode2D.graphVisible) {
        throw new Error('2D graph should be visible in 2D mode')
      }
      console.log('2D mode working correctly')

      // Test Both mode
      console.log('Clicking Both toggle...')
      await page.click('[data-ic-option="both"]')
      await new Promise((resolve) => setTimeout(resolve, 500))

      const modeBoth = await page.evaluate(() => {
        const canvas = document.querySelector('#isometric-contributions')
        const calendarGraph = document.querySelector('.js-calendar-graph')
        const canvasStyle = window.getComputedStyle(canvas)
        const graphStyle = window.getComputedStyle(calendarGraph)
        return {
          canvasVisible: canvasStyle.display !== 'none',
          graphVisible: graphStyle.display !== 'none'
        }
      })

      if (!modeBoth.canvasVisible) {
        throw new Error('3D canvas should be visible in Both mode')
      }
      if (!modeBoth.graphVisible) {
        throw new Error('2D graph should be visible in Both mode')
      }
      console.log('Both mode working correctly')

      // Switch back to 3D for contribution data check
      await page.click('[data-ic-option="cubes"]')
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log('Checking contribution data...')
      const contribTotal = await page.$eval(
        '.ic-contributions-wrapper ::-p-text(Contributions) + div ::-p-text(Total)',
        (element) => element.previousElementSibling.textContent
      )

      const validatedTotal = validateNumberIsNonNegative(
        contribTotal.toString()
      )
      validateContributionTotal(validatedTotal, profile.totalRange)

      const bestDayText = await page.$eval(
        '.ic-contributions-wrapper ::-p-text(Best day) + span',
        (element) => element.textContent
      )
      if (
        profile.expectedBestDay !== 'has-activity' &&
        bestDayText !== profile.expectedBestDay
      ) {
        throw new Error(
          `Expected "${profile.expectedBestDay}", got "${bestDayText}"`
        )
      }
      if (
        profile.expectedBestDay === 'has-activity' &&
        bestDayText === 'No activity found'
      ) {
        throw new Error('Expected an activity date for Best day')
      }

      console.log('Extension working correctly!')
      console.log('Contribution total:', validatedTotal.toLocaleString())
    }

    await browser.close()
  } catch (error) {
    console.error('Extension check failed:', error.message)

    try {
      const pages = await browser.pages()
      const page = pages[0]
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
      console.log('Error screenshot saved to error-screenshot.png')
    } catch {
      console.log('Could not capture screenshot')
    }

    await browser.close()
    throw error
  }
}

run()
