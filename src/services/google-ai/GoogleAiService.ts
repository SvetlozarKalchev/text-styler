import { GoogleAIStudioApiResponse, LLMResponse } from "./types";
import { parseAiStudioResponse } from "./utils";

export class GoogleAiService {
    private apiUrlWithKey: string;

    constructor(apiUrlWithKey: string) {
        this.apiUrlWithKey = apiUrlWithKey;
    }

    private callGoogleAiStudioApi = async (text: string): Promise<GoogleAIStudioApiResponse> => {
        const requestBody = {
            contents: [
                {
                    parts: [
                        // Ideally the prompt should come from a separate layer/service and be configurable in some way.
                        { text: `Fix all grammar and styling issues for the text after the colon. Return only the improved text without the prompt:${text}` }
                    ]
                }
            ]
        };

        const response = await fetch(this.apiUrlWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        return await response.json();
    }

    public queryLLM = async (data: string): Promise<LLMResponse> => {
        const googleAiStudioRawResponse: GoogleAIStudioApiResponse = await this.callGoogleAiStudioApi(data);

        const parsedResponse = parseAiStudioResponse(googleAiStudioRawResponse);

        return parsedResponse;
    }
}
