import { nanoid } from 'nanoid';
import { IJobRepository } from "../../repositories/JobRepository";
import { IQueueRepository } from "../../repositories/QueueRepository";
import { JOB_ERROR_MESSAGES, JOB_STATES, TOKEN_SETTINGS } from './consts';

export type JobResponse = {
    error: string;
    state: string;
    output_text: string;
}

export interface IJobManager {
    createJob(text: string): Promise<void>;
    getJob(jobId: string, token: string): Promise<JobResponse>;
}

export class JobManager {
    private jobRepository: IJobRepository;
    private queueRepository: IQueueRepository;

    constructor(jobRepository: IJobRepository, queueRepository: IQueueRepository) {
        this.jobRepository = jobRepository;
        this.queueRepository = queueRepository;
    }

    /**
     * Generates an id and token for a new job and stores a job object in a Redis hash.
     * @param text
     */
    public async createJob(text: string): Promise<void> {
        const jobId = nanoid(TOKEN_SETTINGS.JOB_ID_CHAR_LENGTH);
        const tokenId = nanoid(TOKEN_SETTINGS.TOKEN_CHAR_LENGTH);

        this.queueRepository.enqueue(jobId);
        this.jobRepository.createJob({
            job_id: jobId,
            token_id: tokenId,
            state: JOB_STATES.CREATED,
            input_text: text,
            output_text: ''
        });
    }

    public async getJob(jobId: string, token: string): Promise<JobResponse> {
        const jobResponse = {
            error: '',
            state: '',
            output_text: ''
        }

        const jobData = await this.jobRepository.getJob(jobId);

        if (!jobData) {
            jobResponse.error = JOB_ERROR_MESSAGES.NO_JOB_FOUND;
        }

        if (jobData?.token_id !== token) {
            jobResponse.error = JOB_ERROR_MESSAGES.WRONG_JOB_ID_TOKEN
        }

        if (jobData?.state === JOB_STATES.CREATED) {
            jobResponse.error = JOB_ERROR_MESSAGES.JOB_IN_PROCESSING;
        }

        if (jobData?.state === JOB_STATES.COMPLETED) {
            jobResponse.state = jobData.state;
            jobResponse.output_text = jobData?.output_text || '';
        }

        return jobResponse
    }
}
