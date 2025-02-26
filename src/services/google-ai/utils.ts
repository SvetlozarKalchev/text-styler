import { GoogleAIStudioApiResponse, LLMResponse } from "./types"

export const parseAiStudioResponse = (response: GoogleAIStudioApiResponse): LLMResponse => {
    return {
        result: response?.candidates?.[0]?.content?.parts[0].text
    }
}
