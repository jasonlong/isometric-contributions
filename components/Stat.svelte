<script lang="ts">
  export let value: string
  export let label: string
  export let description: string
</script>

<div class="p-2">
  <span class="d-block f2 text-bold color-fg-success lh-condensed"
    >{value}</span>
  <span class="d-block text-small text-bold">{label}</span>
  <span class="d-none d-sm-block text-small color-fg-muted">
    {description}
  </span>
</div>
