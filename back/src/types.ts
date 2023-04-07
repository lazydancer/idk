export const enum ChestType {
    Station,
    Inventory
}

export interface Item {
    id: number;
    name: string;
    metadata: number;
    nbt: object | null;
    display_name: string;
    stack_size: number;
}

export interface Location {
    chest_type: ChestType;
    chest: number;
    slot: number;
    shulker_slot: number | null;
}

export interface ItemLocation {
    item: Item;
    location: Location;
    count: number;
}