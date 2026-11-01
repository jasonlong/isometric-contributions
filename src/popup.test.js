/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import markup from './popup.html?raw'

let storedSettings
let runtime
let get
let set

beforeEach(() => {
  vi.resetModules()
  document.documentElement.innerHTML = markup
  storedSettings = { heightScale: 'square-root' }
  runtime = {}
  get = vi.fn((_keys, callback) => callback(storedSettings))
  set = vi.fn((_settings, callback) => callback())
  vi.stubGlobal('chrome', { runtime, storage: { local: { get, set } } })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

const selectedScale = () => document.querySelector('input:checked')?.value

it('loads the saved choice and persists a selection from the menu', async () => {
  await import('./popup.js')
  expect(selectedScale()).toBe('square-root')
  expect(document.querySelector('fieldset').disabled).toBe(false)
  expect(
    document.querySelector('input[value="logarithmic"]').labels[0].textContent
  ).toContain('Logarithmic')
  const logarithmic = document.querySelector('input[value="logarithmic"]')
  logarithmic.focus()
  logarithmic.click()
  expect(set).toHaveBeenCalledWith(
    { heightScale: 'logarithmic' },
    expect.any(Function)
  )
  expect(selectedScale()).toBe('logarithmic')
  expect(document.activeElement).toBe(logarithmic)
  expect(document.querySelector('[role="status"]').textContent).toContain(
    'Saved'
  )
})

it.each([undefined, 'unknown', 'toString'])(
  'defaults to linear for a missing or invalid preference (%s)',
  async (value) => {
    storedSettings.heightScale = value
    await import('./popup.js')
    expect(selectedScale()).toBe('linear')
    expect(set).not.toHaveBeenCalled()
  }
)

it('waits for saved settings before accepting input', async () => {
  let finishLoading
  get.mockImplementation((_keys, callback) => {
    finishLoading = callback
  })
  await import('./popup.js')
  document.querySelector('input[value="linear"]').click()
  expect(set).not.toHaveBeenCalled()
  expect(document.querySelector('fieldset').disabled).toBe(true)
  finishLoading({ heightScale: 'logarithmic' })
  expect(selectedScale()).toBe('logarithmic')
  expect(document.querySelector('fieldset').disabled).toBe(false)
})

it('restores the saved choice and reports an unsuccessful save', async () => {
  await import('./popup.js')
  set.mockImplementation((_settings, callback) => {
    runtime.lastError = { message: 'Storage unavailable' }
    callback()
    delete runtime.lastError
  })
  document.querySelector('input[value="linear"]').click()
  expect(selectedScale()).toBe('square-root')
  expect(document.querySelector('fieldset').disabled).toBe(false)
  expect(document.querySelector('[role="status"]').textContent).toContain(
    'Could not save'
  )
})

it('reports a loading error without overwriting the saved preference', async () => {
  runtime.lastError = { message: 'Storage unavailable' }
  await import('./popup.js')
  expect(document.querySelector('fieldset').disabled).toBe(true)
  expect(document.querySelector('[role="status"]').textContent).toContain(
    'Could not load'
  )
  expect(set).not.toHaveBeenCalled()
})
