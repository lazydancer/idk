import { run_server } from './routes/main';
import { Worker } from './work/worker'


console.log("Starting server")

run_server();

try {
    const worker = new Worker()
    setTimeout(() => worker.work(), 5000);
} catch (e) {
    console.log("Could not start worker")
    console.log("e", e)
}

