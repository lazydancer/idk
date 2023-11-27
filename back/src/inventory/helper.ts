import * as types from "../types/types";

export function get_full_shulkers(inventory: types.ItemLocation[]): {item: types.Item, location: types.Location, inner_item: types.Item}[] {
    const fullShulkers = [];
    for (const {item, location, count} of inventory) {
      if (item.name.endsWith("shulker_box")) {

        const shulker_slots = find_shulker_contents(inventory, location)

        if (
          shulker_slots.length === 27 &&
          shulker_slots.every(({count}) => count === shulker_slots[0].item.stack_size) && 
          shulker_slots.every(({item}) => item.id === shulker_slots[0].item.id)
        ) {
          fullShulkers.push({
            location: location,
            item: item,
            inner_item: shulker_slots[0].item,
          })
        }
      }
    }
    return fullShulkers;
}

export function get_non_full_shulkers(inventory: types.ItemLocation[], item: types.Item): {location: types.Location}[] {
  const nonFullShulkers = [];
  for (const {item, location, count} of inventory) {
    if (item.name.endsWith("shulker_box")) {

        const shulker_slots = find_shulker_contents(inventory, location)

        if( shulker_slots.length == 0 ) {
            nonFullShulkers.push({
                location: location,
            })
        } else if  (shulker_slots.length < 27 && shulker_slots.every(({item}) => item.id === shulker_slots[0].item.id)) {
            nonFullShulkers.push({
                location: location,
            })
        } 
    }
  }
  return nonFullShulkers;
}

export function find_shulker_contents(inventory: types.ItemLocation[], shulker_location: types.Location): types.ItemLocation[] {
    return inventory.filter(({location}) => 
        location.chest === shulker_location.chest && 
        location.slot == shulker_location.slot &&
        location.shulker_slot != null
    )
}

export function apply_moves(chest_type: types.ChestType, inventory: types.ItemLocation[], moves: types.MoveItem[]): types.ItemLocation[] {
  // Create a deep copy of the inventory to modify
  const newInventory = JSON.parse(JSON.stringify(inventory));

  for (const move of moves) {
    const fromLocationIndex = newInventory.findIndex(
      (loc: types.ItemLocation) =>
        loc.location.chest_type === move.from.chest_type &&
        loc.location.chest === move.from.chest &&
        loc.location.slot === move.from.slot &&
        loc.location.shulker_slot === move.from.shulker_slot
    );

    if (fromLocationIndex !== -1) {
      newInventory[fromLocationIndex].count -= move.count;
      if (newInventory[fromLocationIndex].count <= 0) {
        newInventory.splice(fromLocationIndex, 1);
      }
    }

    const toLocationIndex = newInventory.findIndex(
      (loc: types.ItemLocation) =>
        loc.location.chest_type === move.to.chest_type &&
        loc.location.chest === move.to.chest &&
        loc.location.slot === move.to.slot &&
        loc.location.shulker_slot === move.to.shulker_slot
    );

    if (toLocationIndex !== -1) {
      newInventory[toLocationIndex].count += move.count;
    } else if (move.to.chest_type === chest_type) {
      newInventory.push({
        item: move.item,
        location: move.to,
        count: move.count,
      });
    }
  }

  // Return the updated inventory
  return newInventory;
}

export function equal_inventories(inventory1: types.ItemLocation[], inventory2: types.ItemLocation[]): boolean {
  // If the inventories have different lengths, they are not equal
  if (inventory1.length !== inventory2.length) {
    return false;
  }

  // Sort the inventories by item and location
  const sortedInventory1 = inventory1.slice().sort((a, b) => {
    if (a.item.id !== b.item.id) {
      return a.item.id - b.item.id;
    } else if (a.location.chest_type !== b.location.chest_type) {
      return a.location.chest_type - b.location.chest_type;
    } else if (a.location.chest !== b.location.chest) {
      return a.location.chest - b.location.chest;
    } else if (a.location.slot !== b.location.slot) {
      return a.location.slot - b.location.slot;
    } else if (a.location.shulker_slot === null && b.location.shulker_slot !== null) {
      return -1;
    } else if (a.location.shulker_slot !== null && b.location.shulker_slot === null) {
      return 1;
    } else if (a.location.shulker_slot !== null && b.location.shulker_slot !== null) {
      return a.location.shulker_slot - b.location.shulker_slot;
    } else {
      return 0;
    }
  });

  const sortedInventory2 = inventory2.slice().sort((a, b) => {
    if (a.item.id !== b.item.id) {
      return a.item.id - b.item.id;
    } else if (a.location.chest_type !== b.location.chest_type) {
      return a.location.chest_type - b.location.chest_type;
    } else if (a.location.chest !== b.location.chest) {
      return a.location.chest - b.location.chest;
    } else if (a.location.slot !== b.location.slot) {
      return a.location.slot - b.location.slot;
    } else if (a.location.shulker_slot === null && b.location.shulker_slot !== null) {
      return -1;
    } else if (a.location.shulker_slot !== null && b.location.shulker_slot === null) {
      return 1;
    } else if (a.location.shulker_slot !== null && b.location.shulker_slot !== null) {
      return a.location.shulker_slot - b.location.shulker_slot;
    } else {
      return 0;
    }
  });

  // Compare the sorted inventories
  for (let i = 0; i < sortedInventory1.length; i++) {
    if (
      sortedInventory1[i].item.id !== sortedInventory2[i].item.id ||
      sortedInventory1[i].location.chest_type !== sortedInventory2[i].location.chest_type ||
      sortedInventory1[i].location.chest !== sortedInventory2[i].location.chest ||
      sortedInventory1[i].location.slot !== sortedInventory2[i].location.slot ||
      sortedInventory1[i].location.shulker_slot !== sortedInventory2[i].location.shulker_slot ||
      sortedInventory1[i].count !== sortedInventory2[i].count
    ) {
      return false;
    }
  }

  return true;
}