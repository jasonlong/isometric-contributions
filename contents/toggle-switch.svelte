<script context="module" lang="ts">
  import type { PlasmoCSConfig } from 'plasmo'

  export const config: PlasmoCSConfig = {
    matches: ['https://github.com/*']
  }

  export const getRootContainer = async () => {
    const contributionsBox: HTMLElement = document.querySelector('.js-yearly-contributions')
    let insertLocation: HTMLElement = contributionsBox.querySelector('h2')
    const newNode = document.createElement('div')
    newNode.className = 'float-right'
    if (insertLocation?.previousElementSibling?.nodeName === 'DETAILS') {
      insertLocation = insertLocation.previousElementSibling as HTMLElement
    }
    insertLocation.parentNode.insertBefore(newNode, insertLocation)
    return newNode
  }
</script>

<script lang="ts">
  import { Storage } from '@plasmohq/storage'

  const storage = new Storage()
  let currentMode: string

  Promise.all([storage.get<string>('mode')]).then(([mode = '3d']) => {
    currentMode = mode
  })

  $: {
    storage.set('mode', currentMode)
  }
</script>

<div class="BtnGroup ml-3">
  <button
    on:click={() => (currentMode = '2d')}
    class:selected={currentMode === '2d'}
    class="btn BtnGroup-item btn-sm py-0 px-1"
  >
    2D
  </button>
  <button
    on:click={() => (currentMode = '3d')}
    class:selected={currentMode === '3d'}
    class="btn BtnGroup-item btn-sm py-0 px-1"
  >
    3D
  </button>
</div>
