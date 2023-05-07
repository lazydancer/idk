import * as db from './db'
import * as actions from './actions'
import * as types from './types'
import * as inventory from './inventory';


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
                    case types.JobType.Move:
                        const moves = job.parameters;
                        console.log(moves);

                        await actions.move(this.player, moves);
                        await db.apply_moves(moves)

                        break;
                    case types.JobType.Survey:
                        const parameters = job.parameters;
                        const deposit = parameters.deposit
                        
                        const items = await actions.survey(this.player, parameters.chest_type, parameters.chest);
                        await db.get_item_ids(items.map((i: any) => i.item))

                        if (deposit) {
                            await inventory.deposit(items);
                        } else {
                            // data is written to the stations database, which can later be queried and returned from the front end
                            console.log("unimplemented")
                            // db.add_items_station(station.chest, items)
                        }

                        break;
                }
                db.change_job_status(job.id, 'completed');
            } catch (error) {
                console.log(error);
                db.change_job_status(job.id, 'failed');
            }
        }   

        setTimeout(() => this.work(), 1000);

    }

}
