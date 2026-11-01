import { HEIGHT_SCALES, normalizeHeightScale } from './settings.js'

const fieldset = document.querySelector('fieldset')
const options = document.getElementById('height-scales')
const status = document.getElementById('save-status')
let savedScale = 'linear'

const showSelection = (value) => {
  for (const input of options.querySelectorAll('input')) {
    input.checked = input.value === value
  }
}

for (const [value, { label, summary }] of Object.entries(HEIGHT_SCALES)) {
  const option = document.createElement('label')
  option.className = 'scale-option'
  const input = document.createElement('input')
  input.type = 'radio'
  input.name = 'heightScale'
  input.value = value
  const text = document.createElement('span')
  const title = document.createElement('strong')
  title.textContent = label
  const description = document.createElement('small')
  description.textContent = summary
  text.append(title, description)
  option.append(input, text)
  options.append(option)
}

chrome.storage.local.get(['heightScale'], (settings) => {
  if (chrome.runtime.lastError) {
    status.textContent = 'Could not load settings. Please reopen this menu.'
    return
  }
  savedScale = normalizeHeightScale(settings.heightScale)
  showSelection(savedScale)
  fieldset.disabled = false
  status.textContent =
    'Applies to all GitHub profiles. Changes save automatically.'
})

options.addEventListener('change', (event) => {
  const value = event.target.value
  if (!Object.hasOwn(HEIGHT_SCALES, value) || value === savedScale) return
  const restoreFocus = document.activeElement === event.target
  fieldset.disabled = true
  status.textContent = 'Saving…'
  chrome.storage.local.set({ heightScale: value }, () => {
    fieldset.disabled = false
    if (chrome.runtime.lastError) {
      showSelection(savedScale)
      status.textContent = 'Could not save this setting. Please try again.'
    } else {
      savedScale = value
      status.textContent = 'Saved for all GitHub profiles.'
    }
    if (restoreFocus) {
      options.querySelector('input:checked').focus()
    }
  })
})
