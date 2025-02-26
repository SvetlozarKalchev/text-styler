import { Request, Response } from 'express';
import { IJobManager } from '../../services/job-manager/JobManager';
import { JOB_STATES } from '../../services/job-manager/consts';
import { JobController } from '../JobController';
import { ERROR_MESSAGES, ERROR_STATUSES, INPUT_LIMITS, MESSAGES } from '../consts';

describe('JobController', () => {
    let jobProcessorMock: IJobManager;
    let jobController: JobController;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        // Create a mock for the job processor with the methods used in the controller.
        jobProcessorMock = {
            createJob: jest.fn() as jest.MockedFunction<(text: string) => Promise<void>>,
            getJob: jest.fn(),
        };

        jobController = new JobController(jobProcessorMock);

        // Create a mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('processText', () => {
        it('should return 400 if text is not provided', async () => {
            req = { body: {} };

            await jobController.processText(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(ERROR_STATUSES.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.TEXT_REQUIRED });
        });

        it('should return 400 if text is too short', async () => {
            req = { body: { text: 'short' } };

            await jobController.processText(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(ERROR_STATUSES.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.TEXT_TOO_SHORT });
        });

        it('should return 400 if text is too long', async () => {
            req = { body: { text: 'a'.repeat(INPUT_LIMITS.MAX_TEXT_LENGTH_CHARS + 1) } };

            await jobController.processText(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(ERROR_STATUSES.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.TEXT_TOO_LONG });
        });

        it('should create a job and return 201 if text is valid', async () => {
            const validText = 'This is a valid text input that meets minimum length requirements.';
            req = { body: { text: validText } };

            await jobController.processText(req as Request, res as Response);

            expect(jobProcessorMock.createJob).toHaveBeenCalledWith(validText);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.JOB_CREATED });
        });

        it('should return 500 if job creation fails', async () => {
            const validText = 'Valid text';
            req = { body: { text: validText } };

            (jobProcessorMock.createJob as jest.Mock).mockRejectedValue(new Error('Creation error'));

            await jobController.processText(req as Request, res as Response);

            expect(jobProcessorMock.createJob).toHaveBeenCalledWith(validText);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.ERROR_CREATING_JOB });
        });
    });

    describe('processJob', () => {
        it('should return 400 if job_id or token is missing', async () => {
            req = { body: {} };

            await jobController.processJob(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(ERROR_STATUSES.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.WRONG_JOB_ID_TOKEN });
        });

        it('should return 400 if job_id or token have invalid lengths', async () => {
            req = { body: { job_id: '123', token: 'short' } };

            await jobController.processJob(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(ERROR_STATUSES.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.WRONG_JOB_ID_TOKEN });
        });

        it('should return 400 if getJob returns an error', async () => {
            req = { body: { job_id: '1234567890', token: 'a'.repeat(20) } };
            (jobProcessorMock.getJob as jest.Mock).mockResolvedValue({ error: 'Some error' });

            await jobController.processJob(req as Request, res as Response);

            expect(jobProcessorMock.getJob).toHaveBeenCalledWith('1234567890', 'a'.repeat(20));
            expect(res.status).toHaveBeenCalledWith(ERROR_STATUSES.BAD_REQUEST);
            expect(res.json).toHaveBeenCalledWith({ error: 'Some error' });
        });

        it('should return 202 if job is still in processing', async () => {
            req = { body: { job_id: '1234567890', token: 'a'.repeat(20) } };
            (jobProcessorMock.getJob as jest.Mock).mockResolvedValue({ state: JOB_STATES.CREATED });

            await jobController.processJob(req as Request, res as Response);

            expect(jobProcessorMock.getJob).toHaveBeenCalledWith('1234567890', 'a'.repeat(20));
            expect(res.status).toHaveBeenCalledWith(202);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.JOB_IN_PROCESSING });
        });

        it('should return 200 if job is completed', async () => {
            const outputText = 'Job result text';
            req = { body: { job_id: '1234567890', token: 'a'.repeat(20) } };
            (jobProcessorMock.getJob as jest.Mock).mockResolvedValue({ state: JOB_STATES.COMPLETED, output_text: outputText });

            await jobController.processJob(req as Request, res as Response);

            expect(jobProcessorMock.getJob).toHaveBeenCalledWith('1234567890', 'a'.repeat(20));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ output_text: outputText });
        });

        it('should return 500 if getJob throws an error', async () => {
            req = { body: { job_id: '1234567890', token: 'a'.repeat(20) } };
            (jobProcessorMock.getJob as jest.Mock).mockRejectedValue(new Error('Error fetching job'));

            await jobController.processJob(req as Request, res as Response);

            expect(jobProcessorMock.getJob).toHaveBeenCalledWith('1234567890', 'a'.repeat(20));
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: ERROR_MESSAGES.ERROR_GETTING_JOB });
        });
    });
});
