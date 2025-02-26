# What's done

The project has 2 REST endpoints:
- `POST /api/v1/text`
    - Accepts a JSON object with a text property. This is the text that will be restyled by the LLM
- `GET /api/v1/job?job_id=<JOB_ID>token=<TOKEN_ID>`
    - Used to poll the REST API for results of the LLM text processing.

The LLM text processing is done by a Node.js worker thread. There's a basic prompt, which instructs the model what to do.

Data is stored in Redis. There's a FIFO queue for the jobs, which contains job IDs and also a Redis Hash, which contains `job_id`, `token_id`, `state`, `input_text`, `output_text`.

## Improvements
Here are some of the things I would do if I had more time:
- Add rate limiting or some sort of authentication.
- Use Redis transactions and persist the data to disk.
- Create a more generic LLM service that works with different models underneath.
- Implement text deduplication. This would probably require different strategies based on the string length.
- Add more tests, including E2E tests.
- Improve logging.

## How to run the app
Run `docker compose up` to start Redis and Redis Insights.

I didn't have enough time to put the Express app in Docker too, so it's started by running
`npm i && npm run start-dev`

Before that you'll need to create an `.env` file and put the following ENV vars inside:

```
PORT=3000
REDIS_URL=redis://localhost:6379
AI_STUDIO_URL_WITH_API_KEY=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=ADD_YOUR_AI_STUDIO_KEY_HERE
```


## LLM Usage
I've used Copilot to
- Generate type definitions based on the Google AI Service response JSON.
- Generate the job and queue repositories "plumbing" code after describing what I want them to do.
- Generate unit tests. The generated code required some editing.

Overall, I estimate this saved me ~1 hour of work.
