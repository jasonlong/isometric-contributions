
export const formatDate = (date: Date): string => {
  let dateString: string

  if (date) {
    dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return dateString
}

// export const datesDayDifference = (dateString1, dateString2) => {
//   let diffDays = null
//   let date1 = null
//   let date2 = null
//
//   if (dateString1) {
//     const dateParts = dateString1.split('-')
//     date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
//   }
//
//   if (dateString2) {
//     const dateParts = dateString2.split('-')
//     date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
//   }
//
//   if (dateString1 && dateString2) {
//     const timeDiff = Math.abs(date2.getTime() - date1.getTime())
//     diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
//   }
//
//   return diffDays
// }
