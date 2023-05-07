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
        location: number[],
        width: number,
        depth: number,
    }
}

import fs from 'fs'

export function loadConfig(): Config {
    return JSON.parse(fs.readFileSync('offline_config.json', 'utf8'))
}