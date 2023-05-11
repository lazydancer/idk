import { run_server } from './routes/main';
import { Worker } from './work/worker'


run_server();

const worker = new Worker()
setTimeout(() => worker.work(), 5000);
