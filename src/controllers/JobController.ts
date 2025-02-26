import { Request, Response } from 'express';
import { JOB_STATES } from '../services/job-manager/consts';
import { IJobManager } from '../services/job-manager/JobManager';
import { ERROR_MESSAGES, ERROR_STATUSES, INPUT_LIMITS, MESSAGES } from './consts';


export class JobController {
    private jobProcessor: IJobManager;

    constructor(jobProcessor: IJobManager) {
        this.jobProcessor = jobProcessor;
    }

    public processText = async (req: Request, res: Response): Promise<void> => {
        const { text } = req.body;

        if (!text) {
            res.status(ERROR_STATUSES.BAD_REQUEST).json({ error: ERROR_MESSAGES.TEXT_REQUIRED });
            return;
        }

        if (text?.length < INPUT_LIMITS.MIN_TEXT_LENGTH_CHARS) {
            res.status(ERROR_STATUSES.BAD_REQUEST).json({ error: ERROR_MESSAGES.TEXT_TOO_SHORT });
            return;
        }

        if (text?.length > INPUT_LIMITS.MAX_TEXT_LENGTH_CHARS) {
            res.status(ERROR_STATUSES.BAD_REQUEST).json({ error: ERROR_MESSAGES.TEXT_TOO_LONG });
            return;
        }

        try {
            await this.jobProcessor.createJob(text);
            res.status(201).json({ message: MESSAGES.JOB_CREATED });
        } catch (error) {
            console.error(`${ERROR_MESSAGES.ERROR_CREATING_JOB}:`, error);
            res.status(500).json({ error: ERROR_MESSAGES.ERROR_CREATING_JOB });
        }
    }

    public processJob = async (req: Request, res: Response): Promise<void> => {
        const { job_id, token } = req.body;

        if (!job_id || !token || job_id?.length !== 10 || token?.length !== 20) {
            res.status(ERROR_STATUSES.BAD_REQUEST).json({ error: ERROR_MESSAGES.WRONG_JOB_ID_TOKEN });
            return;
        }

        try {
            const jobResponse = await this.jobProcessor.getJob(job_id, token);

            if (jobResponse.error) {
                res.status(ERROR_STATUSES.BAD_REQUEST).json({ error: jobResponse.error });
            }

            if (jobResponse.state === JOB_STATES.CREATED) {
                res.status(202).json({ message: MESSAGES.JOB_IN_PROCESSING });
            }

            if (jobResponse.state === JOB_STATES.COMPLETED) {
                res.status(200).json({ output_text: jobResponse.output_text });
            }
        } catch (error) {
            console.error(`${ERROR_MESSAGES.ERROR_GETTING_JOB}:`, error);
            res.status(500).json({ error: ERROR_MESSAGES.ERROR_GETTING_JOB });
        }
    }
}
