export interface LLMResponse {
    result: string;
}

export interface LLMService {
    queryLLM(data: string): Promise<LLMResponse>;
}

// Definition of the types used in the Google AI Studio API
export interface GoogleAIStudioApiResponse {
    candidates: Candidate[];
    usageMetadata: UsageMetadata;
    modelVersion: string;
}

export interface Candidate {
    content: Content;
    finishReason: string;
    avgLogprobs: number;
}

export interface Content {
    parts: Part[];
    role: string;
}

export interface Part {
    text: string;
}

export interface UsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    promptTokensDetails: TokenDetails[];
    candidatesTokensDetails: TokenDetails[];
}

export interface TokenDetails {
    modality: string;
    tokenCount: number;
}
