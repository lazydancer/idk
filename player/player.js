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
		position = vec3(position.x + 0.5, position.y, position.z + 0.5)

		await bot.lookAt(position);
		bot.setControlState('forward', true);

		return new Promise(resolve => {
		
			let loop = () => {

				if (bot.entity.position.distanceTo(position) < 0.4) {
					bot.setControlState('forward', false);
					resolve();
				}	else {
					setTimeout(loop, 50);
				}

			}

			loop()
		})		

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