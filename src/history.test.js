/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchExtendedStreakData } from './history.js'
import { calculateStreaks } from './utils.js'

const day = (date, count = 1) => ({ date: new Date(date), count })
const calendar = (year, inactiveDate) => {
  const days = []
  for (
    let time = Date.UTC(year, 0, 1);
    time < Date.UTC(year + 1, 0, 1);
    time += 86400000
  ) {
    const date = new Date(time).toISOString().slice(0, 10)
    days.push(
      `<td class="ContributionCalendar-day" data-date="${date}" data-level="${date === inactiveDate ? 0 : 1}"></td>`
    )
  }
  return `<table><tbody><tr>${days.join('')}</tr></tbody></table>`
}
const response = (html) => ({ ok: true, text: async () => html })

afterEach(() => vi.unstubAllGlobals())

describe('historical streak fetching', () => {
  it('requests separate years until the boundary streak breaks', async () => {
    const fetchMock = vi.fn(async (url) => {
      const year = Number(new URL(url).searchParams.get('from').slice(0, 4))
      return response(calendar(year, year === 2022 ? '2022-12-30' : null))
    })
    vi.stubGlobal('fetch', fetchMock)
    const current = [day('2025-01-01', 7), day('2025-01-02', 3)]
    const result = await fetchExtendedStreakData('someone', current)

    expect(fetchMock.mock.calls.map(([url]) => new URL(url).search)).toEqual([
      '?from=2024-01-01&to=2024-12-31',
      '?from=2023-01-01&to=2023-12-31',
      '?from=2022-01-01&to=2022-12-31'
    ])
    expect(calculateStreaks(result).streakCurrent).toBe(734)
    expect(result.slice(-2)).toEqual(current)
  })

  it('stops at a failed year rather than joining nonadjacent calendars', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(calendar(2024)))
      .mockResolvedValueOnce({ ok: false })
    vi.stubGlobal('fetch', fetchMock)
    const result = await fetchExtendedStreakData('someone', [day('2025-01-01')])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(calculateStreaks(result).streakCurrent).toBe(367)
  })

  it('rejects incomplete calendars that could hide a streak break', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        response(
          calendar(2024).replace(
            '<td class="ContributionCalendar-day" data-date="2024-12-30" data-level="1"></td>',
            ''
          )
        )
      )
    )
    const current = [day('2025-01-01')]
    expect(await fetchExtendedStreakData('someone', current)).toEqual(current)
  })

  it('keeps DOM counts for overlapping dates and respects the request bound', async () => {
    const fetchMock = vi.fn(async () => response(calendar(2024)))
    vi.stubGlobal('fetch', fetchMock)
    const current = [day('2024-12-30', 8), day('2024-12-31', 9)]
    const result = await fetchExtendedStreakData('someone', current, 1)
    expect(result).toHaveLength(366)
    expect(result.slice(-2)).toEqual(current)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
