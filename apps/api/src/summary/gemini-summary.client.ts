import {
  buildSummaryPrompt,
  SUMMARY_RESPONSE_SCHEMA,
} from './summary-prompt.js';

export interface GeminiClientLike {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config?: { responseMimeType?: string; responseSchema?: unknown };
    }): Promise<{ text?: string }>;
  };
}

export interface SummaryRequest {
  articleTitle: string;
  articleSource: string;
  sourceText: string;
}

export interface GeneratedSummary {
  title: string;
  content: string;
}

export class GeminiSummaryClient {
  constructor(
    private readonly client: GeminiClientLike,
    private readonly model: string,
  ) {}

  async summarize(request: SummaryRequest): Promise<GeneratedSummary> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildSummaryPrompt(
        request.articleTitle,
        request.articleSource,
        request.sourceText,
      ),
      config: {
        responseMimeType: 'application/json',
        responseSchema: SUMMARY_RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(response.text);
    if (!parsed.title || !parsed.content) {
      throw new Error('Model response missing title or content');
    }

    return { title: parsed.title, content: parsed.content };
  }
}
