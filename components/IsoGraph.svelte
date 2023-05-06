<script lang="ts">
  import { IsometricCSS } from "isometric-css"
  import { onMount } from "svelte"
  import tippy, { roundArrow } from "tippy.js"

  import "tippy.js/dist/svg-arrow.css"

  import { formatDate } from "../lib/dates"
  import type { Day } from "../lib/types"
  import Cube from "./Cube.svelte"

  export let weeks: Array<Array<Day>>
  export let busiestDay: Day

  let graphContainer: HTMLElement
  let containerWidth: number
  let graphScale: number = 1

  const CUBESIZE = 14
  const MAX_HEIGHT = 100
  const MAX_GH_CONTAINER_WIDTH = 894

  onMount(() => {
    IsometricCSS.processDOM()
    handleResize()
    tippy("[data-tippy-content]", {
      arrow: roundArrow,
      placement: "auto",
      animation: "fade",
      theme: "github",
      delay: [400, 100]
    })
    window.addEventListener("resize", handleResize)
  })

  function handleResize() {
    containerWidth = graphContainer.clientWidth
    graphScale = containerWidth / MAX_GH_CONTAINER_WIDTH
  }
</script>

<div
  bind:this={graphContainer}
  on:resize={handleResize}
  class="relative"
  style="margin-left: 104px; margin-top: 40px; height: {500 *
    graphScale}px; transform: scale({graphScale});">
  {#each weeks as week, x}
    {#each week as day, y}
      <Cube
        size={CUBESIZE}
        height={3 + (MAX_HEIGHT / busiestDay.contributions) * day.contributions}
        color={day.color}
        x={CUBESIZE * x + (x * CUBESIZE) / 3 / 2}
        y={CUBESIZE * y + (y * CUBESIZE) / 3 / 2}
        contributions={day.contributions}
        date={formatDate(day.date)}
        busiestDay={day == busiestDay} />
    {/each}
  {/each}
  <!-- Surface to block cubes below the ground plane before animating -->
  <div
    style="width: 832px; height: 108px; background-color: #fff;"
    class="isometric"
    data-view="side"
    data-top="-108"
    data-left="114" />
</div>

<style>
  :global(.tippy-box[data-theme~="github"]) {
    background-color: #222;
    color: #fff;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
  }
  :global(.tippy-box[data-theme~="github"] > .tippy-svg-arrow) {
    fill: #222;
  }
</style>
