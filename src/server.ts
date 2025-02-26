import 'dotenv/config';
import express from 'express';
import { createClient, RedisClientType } from 'redis';
import { COMMON_ERRORS } from './consts';
import { JobController } from './controllers/JobController';
import { JobRepository } from './repositories/JobRepository';
import { QueueRepository } from './repositories/QueueRepository';
import { ROUTES } from './routes';
import { GoogleAiService } from './services/google-ai/GoogleAiService';
import { JobManager } from './services/job-manager/JobManager';
import { WorkerJobProcessor } from './workers/WorkerJobProcessor';

const app = express();

app.use(express.json());

// Connect to Redis running on localhost
const redisClient: RedisClientType = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(err => {
    throw new Error(`${COMMON_ERRORS.REDIS_CONNECTION_ERROR} ${err}`);
});

console.log(`Connected to Redis`);

// Initialize repos, services, and controllers
const jobRepository = new JobRepository(redisClient);
const queueRepository = new QueueRepository(redisClient);

const jobProcessor = new JobManager(jobRepository, queueRepository);
const llmService = new GoogleAiService(process.env.AI_STUDIO_URL_WITH_API_KEY as string);

const jobController = new JobController(jobProcessor);

// Define routes
app.post(ROUTES.TEXT_PROCESSING, jobController.processText)
app.get(ROUTES.JOB_PROCESSING, jobController.processJob)

// This is the Node.js worker thread that processes job ids and makes requests to an LLM service.
const workerJobProcessor = new WorkerJobProcessor(jobRepository, queueRepository, llmService);
workerJobProcessor.startWorker();
console.log('Started worker');

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
