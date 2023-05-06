<script context="module" lang="ts">
  import type { PlasmoCSConfig } from "plasmo"

  import { Storage } from "@plasmohq/storage"

  import IsoGraph from "../components/IsoGraph.svelte"
  import Stat from "../components/Stat.svelte"
  import { formatDate } from "../lib/dates"
  import type { Day } from "../lib/types"
  import { getCountFromNode, getSquareColor } from "../lib/utils"

  export const config: PlasmoCSConfig = {
    matches: ["https://github.com/*"]
  }

  export const getRootContainer = async () => {
    const insertLocation = document.querySelector(".js-calendar-graph")
    const newNode = document.createElement("div")
    newNode.className = "ic-contributions-wrapper position-relative"
    insertLocation.parentNode.insertBefore(newNode, insertLocation)
    return newNode
  }
</script>

<script lang="ts">
  import {
    collectBy,
    descend,
    head,
    last,
    length,
    pipe,
    pluck,
    prop,
    sort,
    sortBy,
    splitWhenever,
    sum,
    whereEq
  } from "ramda"

  const TwoDContainer = document.querySelector(".js-calendar-graph")
  const ThreeDContainer = document.querySelector(".ic-contributions-wrapper")
  const storage = new Storage()
  let currentMode: string

  let countTot: number
  let firstDay: Day
  let lastDay: Day
  let busiestDay: Day
  let weeks: Array<Array<Day>>
  let thisWeekCount: number
  let longestStreak: Array<Day>
  let currentStreak: Array<Day>
  let firstDayLongestStreak: Day
  let lastDayLongestStreak: Day
  let firstDayCurrentStreak: Day
  let lastDayCurrentStreak: Day

  Promise.all([storage.get<string>("mode")]).then(([mode = "3d"]) => {
    currentMode = mode
  })

  storage.watch({
    mode: (m) => {
      currentMode = m.newValue
      setContainerVisibilities()
    }
  })

  function setContainerVisibilities() {
    if (currentMode == "3d") {
      TwoDContainer.classList.add("d-none")
      ThreeDContainer.classList.remove("d-none")
    } else {
      TwoDContainer.classList.remove("d-none")
      ThreeDContainer.classList.add("d-none")
    }
  }

  window.addEventListener("load", () => {
    setContainerVisibilities()

    const calendarData = [
      ...document.querySelectorAll<HTMLElement>(
        ".js-calendar-graph-table tbody td.ContributionCalendar-day"
      )
    ]

    let days = []

    if (calendarData.length !== 0) {
      days = calendarData.map((d) => {
        return {
          contributions: getCountFromNode(d),
          date: new Date(d.dataset.date),
          week: parseInt(d.dataset.ix),
          color: getSquareColor(d)
        } as Day
      })
    }

    const sortByDate = sortBy((d: Day) => d.date)
    const getContributions = pluck("contributions")<number>
    const sumContributions = pipe(getContributions, sum)
    const sortByContributions = sortBy((d: Day) => d.contributions)
    const noContributions = whereEq({ contributions: 0 })
    const continuousContributions = splitWhenever(noContributions)
    const groupByWeek = collectBy(prop("week")<number>)

    // Put the days in order since we fetched then from a table
    const sortedDays = sortByDate(days)

    // Contributions
    countTot = sumContributions(days)
    busiestDay = pipe(sortByContributions, last)(days) as Day
    // TODO: fix this unknown
    weeks = groupByWeek(days) as unknown as Array<Array<Day>>
    thisWeekCount = pipe(groupByWeek, last, sumContributions)(days)
    firstDay = head(sortedDays)
    lastDay = last(sortedDays)

    // Streaks
    const streaks = continuousContributions(sortedDays)
    longestStreak = pipe(sort(descend(length)), head)(streaks) as Array<Day>
    currentStreak = last(streaks) as Array<Day>

    firstDayLongestStreak = head(longestStreak)
    lastDayLongestStreak = last(longestStreak)

    firstDayCurrentStreak = head(currentStreak)
    lastDayCurrentStreak = last(currentStreak)
  })
</script>

<div class="width-full overflow-hidden" class:d-none={currentMode === "2d"}>
  {#if weeks}
    <IsoGraph {weeks} {busiestDay} />
  {/if}
  <div class="position-absolute top-0 right-0 mt-3 mr-5">
    <h5 class="mb-1">Contributions</h5>
    <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
      <Stat
        value={countTot?.toLocaleString()}
        label="Total"
        description={`
          ${formatDate(firstDay?.date)} – ${formatDate(lastDay?.date)}`} />
      <Stat
        value={busiestDay?.contributions.toLocaleString()}
        label="Busiest day"
        description={formatDate(busiestDay?.date)} />
    </div>
  </div>

  <div class="position-absolute bottom-0 left-0 ml-5 mb-6">
    <h5 class="mb-1">Streaks</h5>
    <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
      <Stat
        value={longestStreak?.length.toLocaleString()}
        label="Longest"
        description={`
          ${formatDate(firstDayLongestStreak?.date)} – ${formatDate(
          lastDayLongestStreak?.date
        )}`} />
      <Stat
        value={currentStreak?.length.toLocaleString()}
        label="Current"
        description={`
          ${formatDate(firstDayCurrentStreak?.date)} – ${formatDate(
          lastDayCurrentStreak?.date
        )}`} />
    </div>
  </div>
</div>
