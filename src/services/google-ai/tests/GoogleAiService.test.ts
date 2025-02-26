import { GoogleAiService } from '../GoogleAiService';
import { GoogleAIStudioApiResponse, LLMResponse } from '../types';

describe('GoogleAiService', () => {
    let service: GoogleAiService;
    const mockApiUrl = 'https://test-api-url';

    const mockSuccessResponse: GoogleAIStudioApiResponse = {
        candidates: [{
            content: {
                parts: [{
                    text: "Improved text response"
                }],
                role: "model"
            },
            finishReason: '',
            avgLogprobs: 0
        }],
        usageMetadata: {
            promptTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0,
            promptTokensDetails: [],
            candidatesTokensDetails: []
        },
        modelVersion: ''
    };

    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = jest.fn();
        service = new GoogleAiService(mockApiUrl);
    });

    describe('queryLLM', () => {
        it('should make correct API call and parse response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: () => Promise.resolve(mockSuccessResponse)
            });

            const result: LLMResponse = await service.queryLLM('test text');

            // Verify API call
            expect(global.fetch).toHaveBeenCalledWith(
                mockApiUrl,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: expect.stringContaining('test text')
                })
            );

            // Verify response parsing
            expect(result).toEqual({
                result: "Improved text response",
            });
        });

        it('should handle API errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('API Error')
            );

            await expect(service.queryLLM('test')).rejects.toThrow('API Error');
        });

        it('should handle malformed API responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                json: () => Promise.resolve({})  // Invalid response format
            });

            const result: LLMResponse = await service.queryLLM('test');
            expect(result.result).toBeUndefined();
        });
    });
});
