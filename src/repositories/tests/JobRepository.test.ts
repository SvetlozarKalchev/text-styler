import { RedisClientType } from 'redis';
import { JobDetails, JobRepository } from '../JobRepository';

describe('JobRepository', () => {
    let clientMock: jest.Mocked<RedisClientType>;
    let repository: JobRepository;

    beforeEach(() => {
        // Create a minimal mock for RedisClientType with the methods used in the repository.
        clientMock = {
            hSet: jest.fn(),
            hGetAll: jest.fn(),
        } as unknown as jest.Mocked<RedisClientType>;

        repository = new JobRepository(clientMock);
    });

    describe('createJob', () => {
        it('should call redis.hSet with the correct key and job entries', async () => {
            const job: JobDetails = {
                job_id: '1234567890',
                token_id: 'token1234567890123456',
                state: 'created',
                input_text: 'Sample input text',
                output_text: ''
            };

            await repository.createJob(job);
            const expectedKey = `job:${job.job_id}`;
            // The repository flattens the object entries into an array of key-value pairs.
            const expectedEntries = [
                'job_id', job.job_id,
                'token_id', job.token_id,
                'state', job.state,
                'input_text', job.input_text,
                'output_text', job.output_text
            ];
            expect(clientMock.hSet).toHaveBeenCalledWith(expectedKey, expectedEntries);
        });
    });

    describe('updateJobStateAndOutput', () => {
        it('should call redis.hSet with the updated state and output text', async () => {
            const jobId = '1234567890';
            const state = 'completed';
            const outputText = 'Processed output';
            const expectedKey = `job:${jobId}`;

            await repository.updateJobStateAndOutput(jobId, state, outputText);
            expect(clientMock.hSet).toHaveBeenCalledWith(expectedKey, {
                state: state,
                output_text: outputText
            });
        });
    });

    describe('getJob', () => {
        it('should return null if the job does not exist', async () => {
            const jobId = '1234567890';
            clientMock.hGetAll.mockResolvedValue({}); // Simulate no data returned

            const result = await repository.getJob(jobId);
            expect(result).toBeNull();
        });

        it('should return job details if the job exists', async () => {
            const jobId = '1234567890';
            const jobData = {
                job_id: jobId,
                token_id: 'token1234567890123456',
                state: 'created',
                input_text: 'Sample input text',
                output_text: ''
            };
            clientMock.hGetAll.mockResolvedValue(jobData);

            const result = await repository.getJob(jobId);
            expect(result).toEqual(jobData);
        });
    });
});
