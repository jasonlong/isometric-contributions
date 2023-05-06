export const getCountFromNode = (node: HTMLElement) => {
  // Contribution label formats:
  // No contributions on January 9, 2023
  // 1 contribution on January 10, 2023
  const contributionMatches = node.innerHTML.match(
    /(\d*|No) contributions? on ((.*) (\d{1,2}), (\d{4,}))/
  )

  if (!contributionMatches) {
    return 0
  }

  const dataCount = contributionMatches[1]
  return dataCount === "No" ? 0 : Number.parseInt(dataCount, 10)
}

export const rgbToHex = (rgb: string) => {
  const sep = rgb.includes(',') ? ',' : ' '

  const rgbComponents = rgb.slice(4).split(')')[0].split(sep)

  const r = Number(rgbComponents[0]).toString(16).padStart(2, '0')
  const g = Number(rgbComponents[1]).toString(16).padStart(2, '0')
  const b = Number(rgbComponents[2]).toString(16).padStart(2, '0')

  return r + g + b
}

export const getSquareColor = (rect: HTMLElement) => {
  return rgbToHex(getComputedStyle(rect).getPropertyValue("fill"))
}

