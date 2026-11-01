/** @vitest-environment jsdom */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fetchExtendedStreakData } from './history.js'

vi.mock('./history.js', () => ({ fetchExtendedStreakData: vi.fn() }))

const day = (date, count = 1) => ({ date: new Date(date), count })
const showCalendar = (days) => {
  document.body.innerHTML = `
    <div class="vcard-names-container"></div>
    <main><section class="js-yearly-contributions">
      <h2>Contributions</h2><div><div class="js-calendar-graph">
        <table class="js-calendar-graph-table"><tbody><tr>${days
          .map(
            (d, i) =>
              `<td class="ContributionCalendar-day" data-date="${d.date.toISOString().slice(0, 10)}" data-ix="0" aria-labelledby="tip-${i}" style="fill: rgb(0, 128, 0)"></td>`
          )
          .join('')}</tr></tbody></table>
        ${days.map((d, i) => `<tool-tip id="tip-${i}">${d.count} contributions on a day</tool-tip>`).join('')}
      </div></div>
    </section></main>`
}

let onNavigate
const renderedHeights = []
const clearChart = vi.fn(() => {
  renderedHeights.length = 0
})

beforeEach(() => {
  vi.resetModules()
  onNavigate = null
  localStorage.clear()
  vi.spyOn(document, 'addEventListener').mockImplementation(
    (name, listener) => {
      if (name === 'turbo:load') onNavigate = listener
    }
  )
  vi.stubGlobal('matchMedia', () => ({ addEventListener() {} }))
  vi.stubGlobal(
    'MutationObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal('obelisk', {
    Point: class {},
    Point3D: class {},
    PixelView: class {
      clear = clearChart
      renderObject() {}
    },
    CubeDimension: class {
      constructor(_x, _y, height) {
        renderedHeights.push(height)
      }
    },
    CubeColor: class {
      getByHorizontalColor() {
        return 0
      }
    },
    Cube: class {}
  })
  window.history.replaceState(null, '', '/old-profile')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

const outlierCalendar = () => [
  day('2024-01-01', 0),
  day('2024-01-02', 10),
  day('2024-01-03', 609)
]

const mockChromeStorage = (settings = {}) => {
  let onChanged
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: (_keys, callback) => callback(settings),
        set: vi.fn()
      },
      onChanged: {
        addListener: (listener) => {
          onChanged = listener
        }
      }
    }
  })
  return (changes, area = 'local') => onChanged(changes, area)
}

it.each([
  ['square-root', 'Square root', [3, 15, 103]],
  ['logarithmic', 'Logarithmic', [3, 40, 103]]
])(
  'switches to %s and back while preserving counts and colors',
  async (scale, label, heights) => {
    const notify = mockChromeStorage()
    showCalendar(outlierCalendar())
    await import('./iso.js')
    await vi.waitFor(() => expect(renderedHeights).toEqual([3, 4, 103]))

    const canvas = document.getElementById('isometric-contributions')
    const stats = document.querySelector('.ic-contributions-wrapper > div')
    const originalStats = stats.textContent
    const originalCalendar =
      document.querySelector('.js-calendar-graph').innerHTML
    expect(document.getElementById('ic-height-scale')).toBeNull()
    expect(canvas.getAttribute('aria-label')).toContain('linear')
    expect(clearChart).toHaveBeenCalledTimes(1)

    notify({ heightScale: { newValue: scale } })
    expect(renderedHeights).toEqual(heights)
    expect(clearChart).toHaveBeenCalledTimes(2)
    expect(canvas.getAttribute('aria-label')).toContain(label.toLowerCase())
    expect(canvas.title).not.toBe('')
    expect(stats.textContent).toBe(originalStats)
    expect(document.querySelector('.js-calendar-graph').innerHTML).toBe(
      originalCalendar
    )

    notify({ heightScale: { newValue: 'linear' } })
    expect(renderedHeights).toEqual([3, 4, 103])
    expect(clearChart).toHaveBeenCalledTimes(3)
    expect(canvas.getAttribute('aria-label')).toContain('linear')
  }
)

it.each([
  ['localStorage', 'square-root', [3, 15, 103]],
  ['chrome.storage.local', 'square-root', [3, 15, 103]],
  ['localStorage', 'logarithmic', [3, 40, 103]],
  ['chrome.storage.local', 'logarithmic', [3, 40, 103]]
])(
  'restores a %s preference for %s and keeps it after navigation',
  async (storageType, scale, heights) => {
    if (storageType === 'chrome.storage.local') {
      mockChromeStorage({ heightScale: scale, toggleSetting: 'both' })
    } else {
      localStorage.setItem('heightScale', scale)
      localStorage.setItem('toggleSetting', 'both')
    }
    showCalendar(outlierCalendar())
    await import('./iso.js')
    await vi.waitFor(() => expect(renderedHeights).toEqual(heights))
    expect(
      document
        .getElementById('isometric-contributions')
        .getAttribute('aria-label')
    ).toContain(scale.replace('-', ' '))
    expect(
      document.querySelector('.js-yearly-contributions').classList
    ).toContain('ic-both')

    window.history.replaceState(null, '', '/new-profile')
    showCalendar(outlierCalendar())
    onNavigate()
    expect(renderedHeights).toEqual(heights)
    expect(
      document.querySelector('.js-yearly-contributions').classList
    ).toContain('ic-both')
  }
)

it('falls back to linear for an unrecognized stored height scale', async () => {
  localStorage.setItem('heightScale', 'unknown')
  showCalendar(outlierCalendar())
  await import('./iso.js')
  await vi.waitFor(() => expect(renderedHeights).toEqual([3, 4, 103]))
  expect(
    document
      .getElementById('isometric-contributions')
      .getAttribute('aria-label')
  ).toContain('linear')
})

it('ignores unrelated storage changes and resets a removed setting to linear', async () => {
  const notify = mockChromeStorage({ heightScale: 'square-root' })
  showCalendar(outlierCalendar())
  await import('./iso.js')
  await vi.waitFor(() => expect(renderedHeights).toEqual([3, 15, 103]))
  notify({ heightScale: { newValue: 'logarithmic' } }, 'sync')
  notify({ toggleSetting: { newValue: 'squares' } })
  notify({ heightScale: { newValue: 'square-root' } })
  expect(clearChart).toHaveBeenCalledTimes(1)
  notify({ heightScale: { oldValue: 'square-root' } })
  expect(renderedHeights).toEqual([3, 4, 103])
})

it('remembers changes made while no chart is present for the next profile', async () => {
  const notify = mockChromeStorage()
  await import('./iso.js')
  await vi.waitFor(() => expect(onNavigate).toBeTypeOf('function'))
  expect(() =>
    notify({ heightScale: { newValue: 'logarithmic' } })
  ).not.toThrow()
  showCalendar(outlierCalendar())
  onNavigate()
  expect(renderedHeights).toEqual([3, 40, 103])
})

it.each(['another profile', 'another year on the same profile'])(
  'ignores a delayed historical response after navigating to %s',
  async (destination) => {
    const oldDays = [day('2024-01-01'), day('2024-01-02')]
    showCalendar(oldDays)
    let resolveOld
    let resolveNew
    fetchExtendedStreakData
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNew = resolve
          })
      )

    await import('./iso.js')
    await vi.waitFor(() =>
      expect(fetchExtendedStreakData).toHaveBeenCalledTimes(1)
    )
    const oldSignal = fetchExtendedStreakData.mock.calls[0][3]
    window.history.replaceState(
      null,
      '',
      destination === 'another profile'
        ? '/new-profile'
        : '/old-profile?tab=overview&from=2023-01-01'
    )
    const newDays = [day('2023-01-01')]
    showCalendar(newDays)
    onNavigate()
    expect(oldSignal.aborted).toBe(true)
    expect(fetchExtendedStreakData).toHaveBeenCalledTimes(2)

    resolveNew(newDays)
    await vi.waitFor(() =>
      expect(
        document.getElementById('ic-streak-longest-count').textContent
      ).toBe('1 days')
    )
    resolveOld([day('2023-12-31'), ...oldDays])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.getElementById('ic-streak-longest-count').textContent).toBe(
      '1 days'
    )
    expect(document.getElementById('ic-streak-longest-dates').textContent).toBe(
      'Jan 1 → Jan 1'
    )
  }
)

const boundaryCalendar = (firstDayActive = true) =>
  Array.from({ length: 20 }, (_, i) =>
    day(
      `2024-01-${String(i + 1).padStart(2, '0')}`,
      (i < 5 && (i > 0 || firstDayActive)) || i >= 10 ? 1 : 0
    )
  )

it('extends a shorter boundary streak that can exceed the visible longest', async () => {
  const current = boundaryCalendar()
  const historical = Array.from({ length: 100 }, (_, i) => ({
    date: new Date(Date.UTC(2023, 8, 23 + i)),
    count: 1
  }))
  showCalendar(current)
  fetchExtendedStreakData.mockResolvedValueOnce([...historical, ...current])
  await import('./iso.js')
  await vi.waitFor(() =>
    expect(document.getElementById('ic-streak-longest-count').textContent).toBe(
      '105 days'
    )
  )
  expect(fetchExtendedStreakData).toHaveBeenCalledTimes(1)
  expect(document.getElementById('ic-streak-current-count').textContent).toBe(
    '10 days'
  )
})

it('skips historical requests when the first visible day is inactive', async () => {
  showCalendar(boundaryCalendar(false))
  await import('./iso.js')
  await vi.waitFor(() =>
    expect(document.getElementById('ic-streak-longest-count').textContent).toBe(
      '10 days'
    )
  )
  expect(fetchExtendedStreakData).not.toHaveBeenCalled()
})
