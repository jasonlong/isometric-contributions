export const HEIGHT_SCALES = {
  linear: {
    label: 'Linear',
    summary: 'Heights proportional to daily counts.',
    description: 'Linear heights are proportional to contribution counts.'
  },
  'square-root': {
    label: 'Square root',
    summary: 'A gentle boost for everyday activity.',
    description:
      'Square-root heights give everyday activity a moderate boost while keeping contribution peaks distinct.'
  },
  logarithmic: {
    label: 'Logarithmic',
    summary: 'A stronger boost for quieter days.',
    description:
      'Logarithmic heights keep everyday activity visible alongside contribution peaks.'
  }
}

export const normalizeHeightScale = (value) =>
  Object.hasOwn(HEIGHT_SCALES, value) ? value : 'linear'
