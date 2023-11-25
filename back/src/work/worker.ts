import * as db from '../model/db'
import * as actions from './actions'
import * as types from '../types/types'
import * as inventory from '../inventory/inventory';


import { Player } from './player'

export class Worker {
    player: Player;

    constructor() {
        this.player = new Player()
    }

    async work() {
        const job = await db.get_next_job();

        if (job) {
            db.change_job_status(job.id, 'in_progress');
            try {
                switch (job.type) {
                    /*
                        Main withdraw and deposit functions
                    */
                    case types.JobType.Withdraw:
                        const withdraw_items = job.parameters.items;
                        const station = job.parameters.station;
                        const user_id = job.parameters.user_id;
                        
                        const moves = await inventory.withdraw(withdraw_items, station);
                        await actions.move(this.player, moves);
                        console.log("db apply moves", moves)
                        await db.apply_moves(moves);
                        break;

                    case types.JobType.Deposit:
                        const station_id: number = job.parameters.station_id;
                        console.log("station_id", station_id)
                        const deposit_items = await actions.survey(this.player, types.ChestType.Station, station_id);
                        console.log("deposit_items", deposit_items)
                        const deposit_moves = await inventory.deposit(deposit_items);
                        console.log("deposit_moves", deposit_items)
                        await actions.move(this.player, deposit_moves);
                        await db.apply_moves(deposit_moves);
                        break;
                        
                    /*
                        Internal functions (take inventory and optimize it)
                    */
                    case types.JobType.Move:
                        const item_moves = job.parameters;
                        await actions.move(this.player, item_moves);
                        await db.apply_moves(item_moves)
                        break;

                    case types.JobType.Survey:
                        const items = await actions.survey(this.player, job.parameters.chest_type, job.parameters.chest);
                        await db.get_item_ids(items.map((i: any) => i.item))
                        await db.add_survey(job.id, items)
                        break;
                }
                db.change_job_status(job.id, 'completed');
            } catch (error) {
                console.log(error);
                db.change_job_status(job.id, 'failed');
            }

            this.work();
        }  else {
            setTimeout(() => this.work(), 1000);
        }

    }

}
