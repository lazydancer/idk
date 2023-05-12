export const enum ChestType {
    Station,
    Inventory,
    Player,
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

export interface MoveItem { 
    item: Item, 
    from: Location, 
    to: Location, 
    count: number 
}

export const enum JobType { 
    Move = "move",
    Survey = "survey",
}

export const enum JobStatus {
    Queued = "queued",
    InProgress = "in_progress",
    Completed = "completed",
    Failed = "failed",
}

export interface Job {
    id: number;
    type: JobType;
    parameters: any; // Need to store as string in database but can be parsed as JSON
    status: JobStatus;
}