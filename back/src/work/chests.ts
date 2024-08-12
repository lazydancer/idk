import { load_config } from '../types/config'
const config = load_config()
const vec3 = require('vec3')


import * as types from '../types/types'

/*
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
■■ ■■■■ ■■■■ ■■■■ ■■
                    
  ■
  ▣ <-- build anchor (chest)
*/


export function build_map() {
    const { location, direction } = config.build

    let map = build_map_at_origin();

    map = adjust_coords(map, location, direction);

    const xz_map  = map.map(array => array.filter((_, index) => index !== 1));

    return xz_map
}

export function chest_to_location(chest_type: types.ChestType, chest_number: number) {
    const { location, direction } = config.build

    let stand, chest

    switch (chest_type) {
        case types.ChestType.Inventory:
            const originLocation = chest_to_location_origin(chest_number);
            ({ stand, chest } = originLocation);
            break;
        case types.ChestType.Station:
            const loc = station_to_location_origin(chest_number);
            ({ stand, chest } = loc);
            break;
        default: 
            throw new Error(`Invalid chest type: ${chest_type}`);
    }


    const [adjustedStandLocation] = adjust_coords([stand], location, direction);
    const [adjustedChestLocation] = adjust_coords([chest], location, direction);

    console.log("stand", adjustedStandLocation, "chest", adjustedChestLocation)

    return { 
        "stand": adjustedStandLocation, 
        "chest": vec3(adjustedChestLocation[0], adjustedChestLocation[1], adjustedChestLocation[2]) 
    };
}



function build_map_at_origin() {
    // facing east [1, 0, 0]
    const width = config.build.width;
    const depth = config.build.depth;

    const walkwayLength = 5 * width - 4; //1, 6, 11, 16, 21, ...
    const rowLength = depth;

    let map = [];

    for (let i = 0; i < walkwayLength; i++) {
        map.push([2, 0, i]);
    }

    for (let i = 0; i < walkwayLength; i += 5) {
        for (let j = 1; j <= rowLength; j++) {
            map.push([2 + j, 0, i]);
        }
    }

    return map

}

function chest_to_location_origin(chest_number: number) {
    const depth = config.build.depth


    const floor_number = Math.floor(chest_number / 6)

    const row_number = Math.floor(floor_number / (depth * 2))
    const column_number =  Math.floor((floor_number - row_number * depth * 2) /  2 )

     
    const chest_offset_from_row = (floor_number % 2) ? 1 : -1;

    const height_chest = chest_number % 6


    const stand_location = [3 + column_number, 0, 5*row_number]
    const chest_location = [3 + column_number, height_chest, 5*row_number + chest_offset_from_row]

    return {"stand": stand_location, "chest": chest_location}

}

function station_to_location_origin(chest_number: number) {
    let stand = [2, 0, chest_number*2]
    let chest = [1, 0,  chest_number*2]

    return {"stand": stand, "chest": chest}    
}

function rotate_point(point: number[], direction: string) {
    // starting from a east direction [1,0,0]
    const [x, y, z] = point;
    switch (direction) {
        case 'north': return [z, y, -x];
        case 'east': return [x, y, z];
        case 'south': return [-z, y, x];
        case 'west': return [-x, y, -z];
        default: throw new Error(`Invalid direction: ${direction}`);
    }
}

function translate_point(point: number[], location: number[]) {
    return [point[0] + location[0], point[1] + location[1], point[2] + location[2]];
}


function adjust_coords(coords: number[][], location: number[], direction: string) {
    return coords.map(point => translate_point(rotate_point(point, direction), location));
}

