/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from 'vitest'
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

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

it.each(['another profile', 'another year on the same profile'])(
  'ignores a delayed historical response after navigating to %s',
  async (destination) => {
    vi.resetModules()
    let onNavigate
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
        renderObject() {}
      },
      CubeDimension: class {},
      CubeColor: class {
        getByHorizontalColor() {
          return 0
        }
      },
      Cube: class {}
    })
    window.history.replaceState(null, '', '/old-profile')
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
