import * as types from "../types/types";

export function get_full_shulkers(inventory: types.ItemLocation[]): {item: types.Item, location: types.Location, inner_item: types.Item}[] {
    const fullShulkers = [];
    for (const {item, location, count} of inventory) {
      if (item.name.endsWith("shulker_box")) {

        // Find all the subslots in this chest and slot
        const subslots = find_shulker_contents(inventory, location)

        // Check if there are exactly 4 subslots with a count of 64
        if (
          subslots.length === 27 &&
          subslots.every(({count}) => count === subslots[0].item.stack_size) && 
          subslots.every(({item}) => item.id === subslots[0].item.id)
        ) {
          fullShulkers.push({
            location: location,
            item: item,
            inner_item: subslots[0].item,
          })
        }
      }
    }
    return fullShulkers;
}

export function find_shulker_contents(inventory: types.ItemLocation[], shulker_location: types.Location): types.ItemLocation[] {
    return inventory.filter(({location}) => 
        location.chest === shulker_location.chest && 
        location.slot == shulker_location.slot &&
        location.shulker_slot != null
    )
}
