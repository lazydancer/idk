import * as db from '../model/db'
import * as types from '../types/types'

export async function summarize(item: types.Item, inventory: types.ItemLocation[]): Promise<{item: types.Item, count: number, history: any }> {
    let history = await db.get_item_history(item.id)
    history = daily_cumulative(history)
    
    const result = {
      item: item,
      count: inventory.reduce((acc, cur) => acc + cur.count, 0),
      history: history,
    }
    
    return result
  
}


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

    return grouped
}