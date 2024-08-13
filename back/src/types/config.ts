interface Config {
    database: {
        host: string;
        database: string;
        user: string;
        password: string;
        port: number;
    };
    minecraft: {
        host: string;
        port: number;
        email: string;
        password: string;
        auth: string;
    };
    build: {
        location: Vec3, // converted from number[] in config
        direction: 'north'|'east'|'south'|'west',
        width: number,
        depth: number,
        stations: number,
    }
}

import fs from 'fs'
import { Vec3 } from 'vec3'

export function load_config(): Config {
    let parsed = JSON.parse(fs.readFileSync('offline_config.json', 'utf8'))
    const [x, y, z] = parsed.build.location;
    parsed.build.location = new Vec3(x, y, z);

    return parsed;
}