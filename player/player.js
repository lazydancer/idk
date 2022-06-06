const mineflayer = require('mineflayer')
const vec3 = require('vec3')

require('dotenv').config()

class Player {
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

	async open (x, y, z)  {
		this.chest = await this.bot.openChest(this.bot.blockAt(vec3(x, y, z)))
		this.chest_loc = [x, y, z]
		return "done";
	}

	async close()  {
		this.bot.closeWindow(this.chest)
		return "done";
	}

	async lclick(slot) {
		await this.bot.simpleClick.leftMouse(slot)
		return "done";
	}

	async move(x, z) {
		// Adjust from player vs block position


		// This is not ideal but generate the map each time

		function pathfind(start, dest, map) {
			let queue = [[start, []]];

			while (queue.length) 	{
				let [n, path] = queue.shift();

				if ((n[0] == dest[0]) && (n[1] == dest[1])) return [...path, n];
				
				let [x,y] = n;
				for (const a of [[x+1, y], [x-1, y], [x, y+1], [x, y-1]]) {

					if ( includesArray(map, a) && !includesArray(path, a) ) queue.push([a, [...path, n]])
				}
			}



		}

		const includesArray = (data, arr) => {
			return data.some(e => Array.isArray(e) && e.every((o, i) => Object.is(arr[i], o)));
		}

		function straighten_path(path) {
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




		const move_line = async (x, z) =>  {
			let position = vec3(x + 0.5, 78, z + 0.5)

			await this.bot.lookAt(position);
			this.bot.setControlState('forward', true);

			return new Promise(resolve => {
			
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



		const array1 = [...Array(236-128 + 1).keys()].map(x => [173    , 128 + x])
		const array2 = [...Array(227-119 + 1).keys()].map(x => [119 + x, 182    ])
		const array3 = [ 
			[174, 176], [175, 176], [176, 176], [177, 176], [178, 176], [179, 176], 
			[179, 176], [179, 175], [179, 174], [179, 173], [179, 172], [179, 171], [179, 170], [179, 169], 
			[179, 169], [180, 169], [181, 169], [182, 169], [183, 169], [184, 169], 
			[184, 169], [184, 170], [184, 171], [184, 172], [184, 173], [184, 174], [184, 175], [184, 176],
			[184, 172], [185, 172], [186, 172], [187, 172], [188, 172],
			[184, 169], [185, 169], [186, 169], [187, 169], [188, 169]
		]

		let map = [...new Set(array1.concat(array2, array3))].sort()


		let path = pathfind([Math.floor(this.bot.entity.position.x), Math.floor(this.bot.entity.position.z)], [x, z], map)
		console.log(path)
		let s_path = straighten_path(path)
		s_path.shift() // remove first

		for (const p of s_path) {
			await move_line(...p)
		}





		return "done";
	}

	async log() {
		let slots = this.chest.containerItems()	

		slots.forEach(o => {
			o["display_name"] = o["displayName"];
			delete o["displayName"]

			o["stack_size"] = o["stackSize"];
			delete o["stackSize"]

			o["code"] = o["type"];
			delete o["type"]

			o["chest_x"] = parseInt(this.chest_loc[0])
			o["chest_y"] = parseInt(this.chest_loc[1])
			o["chest_z"] = parseInt(this.chest_loc[2])
		})

		return JSON.stringify(slots);
	}

}

module.exports = { Player }