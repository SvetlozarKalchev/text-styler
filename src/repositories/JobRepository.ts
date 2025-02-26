import { RedisClientType } from 'redis';

export interface JobDetails {
    job_id: string;
    token_id: string;
    state: string;
    input_text: string;
    output_text: string;
}

export interface IJobRepository {
    createJob(job: JobDetails): Promise<void>;
    getJob(jobId: string): Promise<JobDetails | null>;
    updateJobStateAndOutput(jobId: string, state: string, outputText: string): Promise<void>;
}

export class JobRepository {
    private client: RedisClientType;

    constructor(client: RedisClientType) {
        this.client = client;
    }

    // Helper to build the job key
    private getJobKey(jobId: string): string {
        return `job:${jobId}`;
    }

    // Store job details as a hash
    async createJob(job: JobDetails): Promise<void> {
        const key = this.getJobKey(job.job_id);
        const jobEntries = Object.entries(job).filter(([, value]) => value !== undefined);
        await this.client.hSet(key, jobEntries.flat());
    }

    async updateJobStateAndOutput(jobId: string, state: string, outputText: string): Promise<void> {
        const key = this.getJobKey(jobId);
        await this.client.hSet(key, {
            state: state,
            output_text: outputText
        });
    }

    // Retrieve job details by job_id
    async getJob(jobId: string): Promise<JobDetails | null> {
        const key = this.getJobKey(jobId);
        const data = await this.client.hGetAll(key);
        if (!data || Object.keys(data).length === 0 || !data.job_id) {
            return null;
        }
        return data as unknown as JobDetails;
    }
}
