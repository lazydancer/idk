import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

import * as types from '../types/types'
import { load_config } from '../types/config'
import { get_item_ids } from '../model/db'

import * as chests from './chests'

const config = load_config()

export class Player {
    bot: any;
    open_container: any = null;
	shulker_location: any = null;
	map: Vec3[] = chests.build_map();
	inventory: types.ItemLocation[] = []// the bot's inventory

	constructor() {
		this.bot = mineflayer.createBot({
				host: config.minecraft.host,
				port: config.minecraft.port,
				username: config.minecraft.email,
				password: config.minecraft.password,
				auth: 'microsoft' 
			})
	}

	async open(chest_type: types.ChestType, chest: number): Promise<types.ItemLocation[]>  {
		if (this.open_container) {
			await this.bot.closeWindow(this.open_container)
		}

		const location = chests.chest_to_location(chest_type, chest)
		await this.move(location.stand)

		this.open_container = await this.bot.openContainer(this.bot.blockAt(location.chest))

		let items = this.open_container.containerItems().map((o: any) => ({
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

		await get_item_ids(items.map((i: any) => i.item))

		return items

	}

	async lclick(slot: number): Promise<void> {
		await this.bot.simpleClick.leftMouse(slot)
		await new Promise(r => setTimeout(r, 50));
	}

	async rclick(slot: number): Promise<void> {
		await this.bot.simpleClick.rightMouse(slot)
		await new Promise(r => setTimeout(r, 50));
	}

	async close(): Promise<void>  {
		await this.bot.closeWindow(this.open_container)
		this.open_container = null
	}


	async open_shulker(chest_type: types.ChestType, chest: number, slot: number): Promise<types.ItemLocation[]> {
		if (this.open_container) {
			await this.bot.closeWindow(this.open_container)
		}

		const hand_slot = 81

		await this.open(chest_type, chest)
		await this.lclick(slot)
		await this.lclick(hand_slot)
		await this.close()

		const player_position = this.bot.entity.position.floored(); 

		let open_place: Vec3 = this.find_open_place(player_position);	

		await new Promise(r => setTimeout(r, 1000));
		
		// Trigger held item change to update held item
		await this.bot.setQuickBarSlot(1)
		await this.bot.setQuickBarSlot(0)

		const blockBelow = this.bot.blockAt(open_place.offset(0, -1, 0));
        await this.bot.placeBlock(blockBelow, new Vec3(0, 1, 0));
		await new Promise(r => setTimeout(r, 100));

		let block = await this.bot.blockAt(open_place)
		let window = await this.bot.openContainer(block)

		this.shulker_location = [chest, chest_type, slot, window, block]		

		let items = window.containerItems().map((o: any) => ({
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

		await get_item_ids(items.map((i: any) => i.item))

		return items
		
	}
	private find_open_place(player_position: Vec3): Vec3 {
		for (const loc of [new Vec3(1, 0, 0), new Vec3(-1, 0, 0), new Vec3(0, 0, 1), new Vec3(0, 0, -1)]) {
			const place = player_position.add(loc);
			if (this.map.some((m: Vec3) => m.x === place.x && m.z === place.z)) {
				return place;
			}
		}

        throw new Error("Couldn't find a place to open the shulker.");
	}

	async close_shulker(): Promise<void> {
		const hand_slot = 81

		let [chest, chest_type, slot, window, block] = this.shulker_location 

		// Close shulker and pick up
		await this.bot.closeWindow(window)
		await this.bot.dig(block)

		await this.move(block.position)

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

	private async move(loc: Vec3): Promise<void> {
		const player_position = this.bot.entity.position.floored();
    	const destination = loc.floored();
		
		if (player_position.equals(destination)) return;
		if (!this.is_position_on_map(player_position)) throw new Error("Player not on map");
		if (!this.is_position_on_map(destination)) throw new Error("Destination not on map");

		const path = this.find_path(player_position, destination, this.map);

		if (!path) throw new Error("Pathfinding failed");

		const straight_path = this.straighten_path(path);

		straight_path.shift(); // Remove the starting position from the path

		for (const step of straight_path) {
			await this.move_along_line(step);
		}
		
	}

	private is_position_on_map(position: Vec3): boolean {
		return this.map.some((e: { equals: (arg0: Vec3) => any; }) => e.equals(position));
	}

	private find_path(start: Vec3, destination: Vec3, map: Vec3[]): Vec3[] | undefined {
		const queue: [Vec3, Vec3[]][] = [[start, []]];
	
		while (queue.length) {
			const [current, path] = queue.shift()!;
	
			if (current.equals(destination)) return [...path, current];
	
			for (const neighbour of this.get_neighbours(current)) {
				if (this.is_position_on_map(neighbour)) {
					queue.push([neighbour, [...path, current]]);
				}
			}
		}
	
		return undefined;
	}
	
	private get_neighbours(position: Vec3): Vec3[] {
		return [
			position.offset(1, 0, 0),
			position.offset(-1, 0, 0),
			position.offset(0, 0, 1),
			position.offset(0, 0, -1)
		];
	}

	private straighten_path(path: Vec3[]): Vec3[] {
		if (path.length < 2) return path;
	
		const newPath: Vec3[] = [];
		let prevDir = new Vec3(-5, 0, -5); // Impossible direction to ensure no match
	
		for (let i = 1; i < path.length; i++) {
			const curDir = path[i].minus(path[i - 1]);
	
			if (!curDir.equals(prevDir)) {
				newPath.push(path[i - 1]);
			}
	
			prevDir = curDir;
		}
	
		return [...newPath, path[path.length - 1]];
	}
	
	private async move_along_line(target: Vec3): Promise<void> {
		const position = target.offset(0.5, 0, 0.5);

		await this.bot.lookAt(position, true);
		this.bot.setControlState('forward', true);
	
		return new Promise<void>(resolve => {
			const loop = () => {
				if (this.bot.entity.position.distanceTo(position) < 0.4) {
					this.bot.setControlState('forward', false);
					resolve();
				} else {
					setTimeout(loop, 50);
				}
			};
			loop();
		});
	}

	async inventory_add(item: types.ItemLocation) {
		let player_item = this.inventory.find((i: types.ItemLocation) => i.location.slot === item.location.slot)
		if (player_item) {
			player_item.count += item.count
			return
		}

		this.inventory.push(item)
	}

	async inventory_remove(item: types.ItemLocation, count: number) {

		let player_item = this.inventory.find((i: any) => i.item.id === item.item.id)

		if (!player_item) {
			throw Error("item not in inventory")
		}

		// remove items from player inventory
		player_item.count -= count

		if (player_item.count === 0) {
			this.inventory.splice(this.inventory.indexOf(player_item), 1);
		}
	}

}
