import { RedisClientType } from 'redis';

export interface IQueueRepository {
    enqueue(jobId: string): Promise<number>;
    dequeue(): Promise<string | null>;
    peek(): Promise<string | null>;
}

export class QueueRepository {
    private client: RedisClientType;
    private queueKey: string;

    constructor(client: RedisClientType, queueKey = 'job_queue') {
        this.client = client;
        this.queueKey = queueKey;
    }

    // Add a job_id to the end of the queue
    async enqueue(jobId: string): Promise<number> {
        return await this.client.rPush(this.queueKey, jobId);
    }

    // Remove and return the first job_id from the FIFO queue
    async dequeue(): Promise<string | null> {
        return await this.client.lPop(this.queueKey);
    }

    // Peek at the first job_id without removing it
    async peek(): Promise<string | null> {
        return await this.client.lIndex(this.queueKey, 0);
    }
}
