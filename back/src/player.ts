const mineflayer = require('mineflayer')
const vec3 = require('vec3')

import * as types from './types'


let offline_config = {
	"host": "localhost",
	"port": 25565,
	"location": [15, 83, 130],
}

let config = offline_config

let BUILD = {
	location: config['location'],
	width: 4,
	depth: 12,
	map: [[0,0]],
	// facing: [0,0,1],
}

const walkway = [...Array(3*BUILD['width']).keys()].map(x => 
	[BUILD['location'][0] + 3 +x, 
	 BUILD['location'][2] - 2]
)
const rows = [...Array(BUILD['width']).keys()].map(w => 
	 [...Array(BUILD['depth']).keys()].map(d => 
		[BUILD['location'][0] + (3+3*w), 
		 BUILD['location'][2] - (d+3)]
	)
).flat()
BUILD["map"] = walkway.concat(rows).sort()

export class Player {
    bot: any
    open_container: any
	shulker_location: any // When opening a shulker need to store location of where to place it back when closing it

	constructor() {
		this.bot = mineflayer.createBot({
				host: config['host'],
				port: config['port'],
				username: process.env['MC_EMAIL'],
				password: process.env['MC_PASS'],
				auth: 'microsoft' 
			})
		this.open_container = null
		this.shulker_location = null
	}

	async open(chest_type: types.ChestType, chest: number)  {
		if ( this.open_container != null ) {
			await this.bot.closeWindow(this.open_container)
		}

		await this.move(this.standing_location(chest_type, chest))

		const location = this.chest_to_location(chest_type, chest)

		this.open_container = await this.bot.openContainer(this.bot.blockAt(location))

		return this.open_container.containerItems().map((o: any) => ({
			item: { 
				id: 0, 
				name: o.name, 
				metadata: o.metadata, 
				nbt: o.nbt, 
				display_name: o.displayName, 
				stack_size: o.stackSize,
			},
			location: { 
				chest_type, 
				chest: chest, 
				slot: o.slot, 
				shulker_slot: null,
			},
			count: o.count,
		}));
	}

	async lclick(slot: any) {
		await this.bot.simpleClick.leftMouse(slot)

		// Does not wait for confirmation
		await new Promise(r => setTimeout(r, 50));

		return "done";
	}

	async rclick(slot: any) {
		await this.bot.simpleClick.rightMouse(slot)

		// Does not wait for confirmation
		await new Promise(r => setTimeout(r, 50));

		return "done";
	}

	async close()  {
		await this.bot.closeWindow(this.open_container)
		this.open_container = null
		return "done";
	}


	async open_shulker(chest_type: any, chest: any, slot: any): Promise<any> {
		if ( this.open_container != null ) {
			await this.bot.closeWindow(this.open_container)
		}

		const hand_slot = 81

		await this.open(chest_type, chest)

		await this.lclick(slot)
		await this.lclick(hand_slot)

		await this.close()

		// get neighbouring space to place shulker
		let player_position = [Math.floor(this.bot.entity.position.x), Math.floor(this.bot.entity.position.z)]

		let open_place: any[] = [];
		for(const loc of [[1,0], [-1,0], [0,1], [0,-1]]) {
			let place = [player_position[0] + loc[0], player_position[1] + loc[1]]
			for (const m of BUILD["map"]) {
				if(m[0] == place[0] && m[1] == place[1]) {
					open_place = place 
					break;
				}
			}
			}

		if(open_place.length == 0) {
			throw console.error("couldn't find a place");
		}

		await new Promise(r => setTimeout(r, 1000));
		
		// Trigger held item change to update held item
		await this.bot.setQuickBarSlot(1)
		await this.bot.setQuickBarSlot(0)

		// place shulker
		await this.bot.placeBlock(this.bot.blockAt(vec3(open_place[0], BUILD["location"][1]-1, open_place[1])), vec3(0,1,0))

		await new Promise(r => setTimeout(r, 100));


		// open
		let block = await this.bot.blockAt(vec3(open_place[0], BUILD["location"][1], open_place[1]))
		let window = await this.bot.openContainer(block)

		this.shulker_location = [chest, chest_type, slot, window, block]		

		return window.containerItems().map((o: any) => ({
			item: { 
				id: 0, 
				name: o.name, 
				metadata: o.metadata, 
				nbt: o.nbt, 
				display_name: o.displayName, 
				stack_size: o.stackSize,
			},
			location: { 
				chest_type, 
				chest: chest, 
				slot: slot, 
				shulker_slot: o.slot,
			},
			count: o.count,
		}))
		
		
	}

	async close_shulker() {
		const hand_slot = 81

		let [chest, chest_type, slot, window, block] = this.shulker_location 

		// Close shulker and pick up
		await this.bot.closeWindow(window)
		await this.bot.dig(block)

		await this.move([block.position["x"], block.position["z"]])

		await new Promise(r => setTimeout(r, 1000));


		// Return shulker to chest
		await this.open(chest_type, chest)
		await new Promise(r => setTimeout(r, 1000));

		await this.lclick(hand_slot)
		await new Promise(r => setTimeout(r, 1000));

		await this.lclick(slot)
		await new Promise(r => setTimeout(r, 1000));


		this.shulker_location = null


	}

	async move_to_ready() {
		const x = BUILD['location'][0] + 5
		const z = BUILD['location'][2] - 2
		await this.move([x, z])
	}

	private async move(loc: any) {
		let x = loc[0]
		let z = loc[1]


		function pathfind(start: any, dest: any, map: any) {
			let queue = [[start, []]];

			while (queue.length) 	{
				let elem: any = queue.shift();
				let n = elem[0]
				let path = elem[1]

				if ((n[0] == dest[0]) && (n[1] == dest[1])) return [...path, n];
				
				let [x,y] = n;
				for (const a of [[x+1, y], [x-1, y], [x, y+1], [x, y-1]]) {

					if ( includesArray(map, a) && !includesArray(path, a) ) queue.push([a, [...path, n]])
				
				}

			}


		}

		const includesArray = (data: any, arr :any) => {
			return data.some((e: any) => Array.isArray(e) && e.every((o, i) => Object.is(arr[i], o)));
		}

		function straighten_path(path :any) {
			if (path.length < 2) return path


			let new_path = []
			let prev_dir = [-5,-5] // not possible, ensure not a match
			let cur_dir = []

			for (let i = 1; i < path.length; i++) {
				let cur_dir = [path[i][0] - path[i-1][0], path[i][1] - path[i-1][1]]

				if ((cur_dir[0] != prev_dir[0]) && (cur_dir[1] != prev_dir[1])) {
					new_path.push(path[i-1])
				}

				prev_dir = cur_dir
			}

			return [...new_path, path[ path.length-1 ]]
		}

		const move_line = async (x :any, z :any) =>  {
			let position = vec3(x + 0.5, BUILD['location'][1], z + 0.5)

			await this.bot.lookAt(position, true);
			this.bot.setControlState('forward', true);

			return new Promise<void>(resolve => {
			
				let loop = () => {

					if (this.bot.entity.position.distanceTo(position) < 0.4) {
						this.bot.setControlState('forward', false);
						resolve();
					}	else {
						setTimeout(loop, 50);
					}

				}

				loop()
			})		

		}
		let player_position = [Math.floor(this.bot.entity.position.x), Math.floor(this.bot.entity.position.z)]

		x = parseInt(x)
		z = parseInt(z)

		if ((player_position[0] == x) && (player_position[1] == z)) {
			return "done"
		}

		if (!includesArray(BUILD["map"], player_position)) {
			throw Error("player not on map")
		}

		if (!includesArray(BUILD["map"], [x,z])) {
			throw Error("destination not on map")
		}

		let path = pathfind(player_position, [x, z], BUILD["map"])
		let s_path = straighten_path(path)
		s_path.shift() // remove first

		for (const p of s_path) {
			await move_line.apply(null, p)
		}


		return "done";
	}

	private log(chest_type: types.ChestType, chest: number) {
		let slots = this.open_container.containerItems();	

		let r = slots.map((o: any) => ({
				item: { 
					id: 0, 
					name: o.name, 
					metadata: o.metadata, 
					nbt: o.nbt, 
					display_name: o.displayName, 
					stack_size: o.stackSize,
				},
				location: { 
					chest_type, 
					chest: chest, 
					slot: o.slot, 
					shulker_slot: null,
				},
				count: o.count,
		}));
		return r

	}

	get_counts() {

		return {
			'inventory': BUILD['width'] * BUILD['depth'] * 6,
			'station': 3,
		}

	}

	private chest_to_location(chest_type: types.ChestType, chest_number: number): any {

		if(chest_type == types.ChestType.Inventory) {

			const offset = [BUILD['location'][0] + 2, BUILD['location'][1], BUILD['location'][2] - 3]

			const x = Math.floor(chest_number / (6*BUILD['depth'])) * 3
			const y = chest_number % 6
			const z = -1*(Math.floor(chest_number / 6 ) % BUILD['depth'])

			return vec3(x + offset[0], y + offset[1], z + offset[2])

		}

		if (chest_type == types.ChestType.Station) {
			return vec3(BUILD['location'][0] + 5 + 2*chest_number, BUILD['location'][1], BUILD['location'][2] - 1)
		}

	}

	private standing_location(chest_type: types.ChestType, chest_number: number): any {

		if(chest_type == types.ChestType.Inventory) {
			const offset = [BUILD['location'][0] + 2, BUILD['location'][1], BUILD['location'][2] - 3]

			const x = Math.floor(chest_number / (6*BUILD['depth'])) * 3
			const z = -1*(Math.floor(chest_number / 6 ) % BUILD['depth'])

			return [x + offset[0] + 1, z + offset[2]]
		}

		if (chest_type == types.ChestType.Station) {
			return [BUILD['location'][0] + 5 + 2*chest_number, BUILD['location'][2] - 2]
		}
	}




}
