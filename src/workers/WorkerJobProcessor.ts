import 'dotenv/config';
import { createClient, RedisClientType } from 'redis';
import { COMMON_ERRORS } from '../consts';
import { ERROR_MESSAGES } from '../controllers/consts';
import { IJobRepository, JobDetails } from '../repositories/JobRepository';
import { IQueueRepository } from '../repositories/QueueRepository';
import { LLMResponse, LLMService } from '../services/google-ai/types';
import { JOB_STATES } from '../services/job-manager/consts';

export class WorkerJobProcessor {
    private jobRepository: IJobRepository;
    private queueRepository: IQueueRepository;
    private llmService: LLMService;

    private redisClient!: RedisClientType

    constructor(jobRepository: IJobRepository, queueRepository: IQueueRepository, llmService: LLMService) {
        this.jobRepository = jobRepository;
        this.queueRepository = queueRepository;
        this.llmService = llmService;
    }

    private async initializeRedis() {
        // The worker needs its dedicated Redis connection, because it blocks it until BLPOP returns a value.
        this.redisClient = createClient({ url: process.env.REDIS_URL });

        this.redisClient.on('error', (err) => {
            throw new Error(`${COMMON_ERRORS.REDIS_CONNECTION_ERROR} ${err}`);
        });

        await this.redisClient.connect();

        console.log('Worker connected to Redis');
    }


    // Process the job
    processJob = async (jobDetails: JobDetails) => {
        console.log('Processing job:', jobDetails);

        try {
            const llmResponse: LLMResponse = await this.llmService.queryLLM(jobDetails?.input_text as string)

            if (llmResponse?.result) {
                this.jobRepository.updateJobStateAndOutput(jobDetails.job_id, JOB_STATES.COMPLETED, llmResponse.result);
            }
        }
        catch (error) {
            console.error(ERROR_MESSAGES.ERROR_PROCESSING_JOB, error);
        }
    }

    startWorker = async () => {
        this.initializeRedis();

        // Continuously wait for new jobs.
        // The connection remains idle until a new element becomes available in the queue
        while (true) {
            try {
                // BLPOP blocks until an element is available.
                const job = await this.redisClient.blPop('job_queue', 0);

                const jobData = await this.jobRepository.getJob(job?.element as string);

                console.log('Worker received job:', jobData);

                if (jobData?.input_text) {
                    // Process the job
                    this.processJob(jobData);
                }
            } catch (error) {
                console.error(ERROR_MESSAGES.ERROR_PROCESSING_JOB, error);
            }
        }
    }
}
