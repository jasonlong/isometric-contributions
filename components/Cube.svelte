<script lang="ts">
  import Color from "colorjs.io"
  import { onMount } from "svelte"
  import tippy from "tippy.js"

  export let size: number
  export let height: number
  export let x: number
  export let y: number
  export let color: string
  export let contributions: number
  export let date: string
  export let busiestDay: boolean

  let colorTop = new Color(`#${color}`).to("oklch")
  let colorTopHover = new Color(`#${color}`).to("oklch")
  let colorFront = new Color(`#${color}`).to("oklch")
  let colorSide = new Color(`#${color}`).to("oklch")

  let currentTopColor = colorTop

  colorTop.lch.c *= 1.2
  colorTopHover.lch.l *= 1.2
  // colorTopHover.lch.c *= 1.2
  colorFront.lch.c *= 1.2
  colorSide.lch.c *= 1.2
  colorFront.lch.l -= 8
  colorSide.lch.l -= 16

  function hover(event) {
    currentTopColor = colorTopHover
  }

  function mouseleave(event) {
    currentTopColor = colorTop
  }
</script>

<div
  class="isometric"
  data-right={x}
  data-left={y}
  data-top="-{height}"
  data-animation="top:0"
  data-animation-repeat="1"
  data-animation-duration="800"
  data-animation-easing="ease-in-out">
  <div
    style="width: {size}px; height: {height}px; background-color: {colorFront}; border: solid 0.1px {colorFront};"
    class="isometric cube-front"
    class:test={busiestDay}
    data-view="front"
    data-right={size} />
  <div
    style="width: {size}px; height: {height}px; background-color: {colorSide}; border: solid 0.1px {colorSide};"
    class="isometric cube-side"
    data-view="side"
    data-left={size} />
  <div
    on:mouseenter={hover}
    on:mouseleave={mouseleave}
    style="width: {size}px; height: {size}px; background-color: {currentTopColor};
    border: solid 0.1px {colorTop};"
    class="cube-top isometric d-flex
    flex-justify-center flex-items-center"
    data-tippy-content="{contributions} contributions
    · {date}"
    data-view="top"
    data-top={height}>
    {#if busiestDay}
      ⭐
    {/if}
  </div>
</div>
