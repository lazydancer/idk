export function daily_cumulative(history: any[]): any[] {
    // get item history

    // group by day
    let grouped = history.reduce((acc:any, cur:{volume: number, date: Date}) => {
      // remove the time from the date and yyyy-mm-dd format
      const date = cur.date.toISOString().split('T')[0]

      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += cur.volume
      return acc
    }, {})

    // convert to array
    grouped = Object.keys(grouped).map((key) => {
      return {
        date: key,
        volume: grouped[key],
      }
    })

    // sort by date
    grouped.sort((a:any, b:any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })


    // find the cumulative sum
    let sum = 0
    grouped.forEach((x:any) => {
      sum += x.volume
      x.volume = sum
    })

    console.log(grouped)


    return grouped
}