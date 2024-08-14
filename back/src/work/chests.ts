import { load_config } from '../types/config'
import { Vec3 } from 'vec3';
import * as types from '../types/types'

const config = load_config()

/*
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
                    
  ■
  ▣ <-- build anchor (chest)
*/

export function build_map(): Vec3[] {
    const { location, direction } = config.build

    let map = build_map_at_origin();
    map = adjust_coords(map, location, direction);

    return map
}

function build_map_at_origin(): Vec3[] {
    // facing east [1, 0, 0]
    const { width, depth } = config.build;
    const walkwayLength = 5 * width - 4;

    let map: Vec3[] = [];

    for (let i = 0; i < walkwayLength; i++) {
        map.push(new Vec3(2, 0, i));
    }

    for (let i = 0; i < walkwayLength; i += 5) {
        for (let j = 1; j <= depth; j++) {
            map.push(new Vec3(2 + j, 0, i));
        }
    }

    return map;
}

export function chest_to_location(chest_type: types.ChestType, chest_number: number) {
    const { location, direction } = config.build;

    const { stand, chest } = get_chest_origin(chest_type, chest_number)

    const [adjustedStandLocation] = adjust_coords([stand], location, direction);
    const [adjustedChestLocation] = adjust_coords([chest], location, direction);

    return {
        stand: adjustedStandLocation,
        chest: adjustedChestLocation
    };
}

function get_chest_origin(chest_type: types.ChestType, chest_number: number): { stand: Vec3, chest: Vec3 } {
    switch (chest_type) {
        case types.ChestType.Inventory:
            return chest_to_location_origin(chest_number);
        case types.ChestType.Station:
            return station_to_location_origin(chest_number);
        default:
            throw new Error(`Invalid chest type: ${chest_type}`);
    }
}

function chest_to_location_origin(chest_number: number): { stand: Vec3, chest: Vec3 } {
    const depth = config.build.depth;

    const floor_number = Math.floor(chest_number / 6);
    const row_number = Math.floor(floor_number / (depth * 2));
    const column_number =  Math.floor((floor_number - row_number * depth * 2) /  2 );
     
    const chest_offset_from_row = (floor_number % 2) ? 1 : -1;
    const height_chest = chest_number % 6;

    const stand_location = new Vec3(3 + column_number, 0, 5 * row_number);
    const chest_location = new Vec3(3 + column_number, height_chest, 5 * row_number + chest_offset_from_row);

    return {"stand": stand_location, "chest": chest_location};
}

function station_to_location_origin(chest_number: number) {
    let stand = new Vec3(2, 0, chest_number*2);
    let chest = new Vec3(1, 0,  chest_number*2);

    return {"stand": stand, "chest": chest};  
}

function rotate_point(point: Vec3, direction: 'north' | 'east' | 'south' | 'west'): Vec3 {
    // Starting from an east direction [1,0,0]
    const { x, y, z } = point;
    switch (direction) {
        case 'north':
            return new Vec3(z, y, -x);
        case 'east':
            return point;
        case 'south':
            return new Vec3(-z, y, x);
        case 'west':
            return new Vec3(-x, y, -z);
        default:
            throw new Error(`Invalid direction: ${direction}`);
    }
}


function adjust_coords(coords: Vec3[], location: Vec3, direction: 'north' | 'east' | 'south' | 'west'): Vec3[] {
    return coords.map(point => rotate_point(point, direction).add(location));
}
