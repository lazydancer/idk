export const enum ChestType {
    Station,
    Inventory
}

export interface Item {
    id: number;
    name: string;
    metadata: number;
    nbt: object;
    display_name: string;
    stack_size: number;
}

export interface Location {
    chest_type: ChestType;
    number: number;
    slot: number;
    shulker_slot: number | null;
}