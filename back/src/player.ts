const mineflayer = require('mineflayer')
const vec3 = require('vec3')

require('dotenv').config()


const BUILDING = {
	location: [16, 83, 129],
	width: 3,
	depth: 7,
	facing: [0,0,1],
	right: [1,0,0], // this could be worked out by math, but I'm lazy
}

export class Player {
    bot: any
    chest: any
    chest_loc: any
	constructor() {
		this.bot = mineflayer.createBot({
				host: "localhost",
				username: process.env['MC_EMAIL'],
				password: process.env['MC_PASS'],
				auth: 'microsoft' 
			})
		this.chest = null
		this.chest_loc = null
	}

	async open (x: any, y: any, z: any)  {
		this.chest = await this.bot.openChest(this.bot.blockAt(vec3(x, y, z)))
		this.chest_loc = [x, y, z]
		return "done";
	}

	async close()  {
		this.bot.closeWindow(this.chest)
		return "done";
	}

	async lclick(slot: any) {
		await this.bot.simpleClick.leftMouse(slot)
		return "done";
	}

	async rclick(slot: any) {
		await this.bot.simpleClick.rightMouse(slot)
		return "done";
	}

	async move(x: any, z: any) {

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
			[BUILDING['location'][0] + (2+x)*BUILDING['right'][0] - BUILDING['facing'][0], 
			 BUILDING['location'][2] + (2+x)*BUILDING['right'][2] - BUILDING['facing'][2]]
		)

		const rows = [...Array(BUILDING['width']).keys()].map(w => 
		 	[...Array(BUILDING['depth']).keys()].map(d => 
				[BUILDING['location'][0] + (2+3*w)*BUILDING['right'][0] - (d+2)*BUILDING['facing'][0], 
				 BUILDING['location'][2] + (2+3*w)*BUILDING['right'][2] - (d+2)*BUILDING['facing'][2]]
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
			throw Error("player not on map")
		}

		if (!includesArray(map, [x,z])) {
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

	async log() {
		let slots = this.chest.containerItems()	

		slots.forEach((o: any) => {
			o["display_name"] = o["displayName"];
			delete o["displayName"]

			o["stack_size"] = o["stackSize"];
			delete o["stackSize"]

			delete o["type"]
			// o["code"] = o["type"];
			// delete o["type"]

			o["chest_x"] = parseInt(this.chest_loc[0])
			o["chest_y"] = parseInt(this.chest_loc[1])
			o["chest_z"] = parseInt(this.chest_loc[2])
		})

		return JSON.stringify(slots);
	}

}

// module.exports = { Player }