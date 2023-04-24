
import { Player } from './player'


/* 
Actor is a wrapper around the player for high level actions and a queue 
*/
export class Actor {
    private player: any
    private queue: any[]

    constructor() {
        this.player = new Player()
        this.queue = []
    }

    async run() {
        // create while loop with delay
        // check if queue is empty
        // if not, pop first item and run it
        // if it is, wait 1 second
        while (true) {
            if (this.queue.length > 0) {
                let action = this.queue.shift()
                await action()
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
}
