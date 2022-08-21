const mineflayer = require('mineflayer')
const vec3 = require('vec3')

require('dotenv').config()


const BUILDING = {
	location: [15, 83, 130],
	width: 3,
	depth: 7,
	// height: 6,
	// facing: [0,0,1],
	// right: [1,0,0], // this could be worked out by math, but I'm lazy
}

export class Player {
    bot: any
    opened_chest: any
	constructor() {
		this.bot = mineflayer.createBot({
				host: "localhost",
				username: process.env['MC_EMAIL'],
				password: process.env['MC_PASS'],
				auth: 'microsoft' 
			})
		this.opened_chest = null
	}

	async open(chest_type: string, chest_number: number)  {
		if ( this.opened_chest != null ) {
			await this.bot.closeWindow(this.opened_chest)
			this.opened_chest = null
		}

		await this.move(this.standing_location(chest_type, chest_number))

		const location = this.chest_to_location(chest_type, chest_number)

		this.opened_chest = await this.bot.openChest(this.bot.blockAt(location))

		return this.log();
	}

	async lclick(slot: any) {
		await this.bot.simpleClick.leftMouse(slot)
		return "done";
	}

	async rclick(slot: any) {
		await this.bot.simpleClick.rightMouse(slot)
		return "done";
	}

	// async close()  {
	// 	this.bot.closeWindow(this.opened_chest)
	// 	return "done";
	// }

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
			console.log('move line', x, z)
			let position = vec3(x + 0.5, BUILDING['location'][1], z + 0.5)

			await this.bot.lookAt(position);
			// await this.bot.waitForTicks(10);
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

		const walkway = [...Array(3*BUILDING['width']).keys()].map(x => 
			[BUILDING['location'][0] + 3 +x, 
			 BUILDING['location'][2] - 2]
		)

		const rows = [...Array(BUILDING['width']).keys()].map(w => 
		 	[...Array(BUILDING['depth']).keys()].map(d => 
				[BUILDING['location'][0] + (3+3*w), 
				 BUILDING['location'][2] - (d+3)]
			)
		).flat()

		let map = walkway.concat(rows).sort()

		let player_position = [Math.floor(this.bot.entity.position.x), Math.floor(this.bot.entity.position.z)]


		x = parseInt(x)
		z = parseInt(z)


		if ((player_position[0] == x) && (player_position[1] == z)) {
			return "done"
		}

		if (!includesArray(map, player_position)) {

			console.log(map, player_position)
			throw Error("player not on map")
		}

		if (!includesArray(map, [x,z])) {

			console.log(map, [x, z])
			throw Error("destination not on map")
		}

		let path = pathfind(player_position, [x, z], map)
		let s_path = straighten_path(path)
		s_path.shift() // remove first

		for (const p of s_path) {
			await move_line.apply(null, p)
		}


		return "done";
	}

	private log() {
		let slots = this.opened_chest.containerItems()	

		slots.forEach((o:any) => {
			o["display_name"] = o["displayName"];
			o["stack_size"] = o["stackSize"];
		})

		slots = slots.map((o: any) => 
			(({ display_name, count, metadata, name, nbt, slot, stack_size}) => ({ display_name, count, metadata, name, nbt, slot, stack_size}))(o))


		return slots;
	}

	get_counts() {

		return {
			'inventory': BUILDING['width'] * BUILDING['depth'] * 6,
			'station': 3,
		}

	}

	private chest_to_location(chest_type: string, chest_number: number): any {

		if(chest_type == 'inventory') {

			const offset = [BUILDING['location'][0] + 2, BUILDING['location'][1], BUILDING['location'][2] - 3]

			const x = Math.floor(chest_number / (6*BUILDING['depth'])) * 3
			const y = chest_number % 6
			const z = -1*(Math.floor(chest_number / 6 ) % BUILDING['depth'])

			return vec3(x + offset[0], y + offset[1], z + offset[2])

		}

		if (chest_type == 'station') {
			return vec3(BUILDING['location'][0] + 5 + 2*chest_number, BUILDING['location'][1], BUILDING['location'][2] - 1)
		}

	}

	private standing_location(chest_type: string, chest_number: number): any {

		if(chest_type == 'inventory') {
			const offset = [BUILDING['location'][0] + 2, BUILDING['location'][1], BUILDING['location'][2] - 3]

			const x = Math.floor(chest_number / (6*BUILDING['depth'])) * 3
			const z = -1*(Math.floor(chest_number / 6 ) % BUILDING['depth'])

			return [x + offset[0] + 1, z + offset[2]]
		}

		if (chest_type == 'station') {
			return [BUILDING['location'][0] + 5 + 2*chest_number, BUILDING['location'][2] - 2]
		}
	}


}
