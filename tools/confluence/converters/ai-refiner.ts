import axios from 'axios';
import { loadAIConfig } from '../../common/config.js';
import { logger } from '../../common/logger.js';

export interface AIConversionRequest {
    sourceContent: string;
    sourceType: 'markdown' | 'storage-xml';
    targetType: 'markdown' | 'storage-xml';
    context?: string;
}

export interface AIConversionResponse {
    convertedContent: string;
    confidence: number;
    warnings?: string[];
}

export class AIConversionService {
    private config = loadAIConfig();

    async refine(request: AIConversionRequest): Promise<AIConversionResponse> {
        if (!this.config.openaiApiKey && !this.config.anthropicApiKey) {
            throw new Error('AI 변환을 위한 API 키가 설정되지 않았습니다.');
        }

        logger.info(`AI를 이용한 지능형 변환 시작: ${request.sourceType} -> ${request.targetType}`);

        try {
            // 실제 구현 시 제공자(OpenAI/Anthropic)에 따라 분기 처리
            // 현재는 OpenAI GPT-4o를 기본 예시로 함
            const prompt = this.buildPrompt(request);
            
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: this.config.defaultModel,
                    messages: [
                        { role: 'system', content: '당신은 전문 기술 문서 변환 에이전트입니다. 주어진 텍스트를 대상 형식으로 완벽하게 변환하십시오. 추가 설명 없이 결과 데이터만 반환하십시오.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = response.data.choices[0].message.content.trim();
            
            // Markdown 코드 블록이 포함되어 돌아온 경우 스트립 처리
            const cleanResult = result.replace(/^```[a-z]*\n([\s\S]*)\n```$/i, '$1');

            return {
                convertedContent: cleanResult,
                confidence: 0.95
            };
        } catch (error) {
            logger.error('AI 변환 중 오류 발생:', error);
            throw error;
        }
    }

    private buildPrompt(request: AIConversionRequest): string {
        return `
원본 형식: ${request.sourceType}
대상 형식: ${request.targetType}
추가 컨텍스트: ${request.context || '없음'}

다음 텍스트를 변환하십시오:

${request.sourceContent}
`;
    }
}
