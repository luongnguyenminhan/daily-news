import { GeminiSummaryClient } from './gemini-summary.client.js';
import type { GeminiClientLike } from './gemini-summary.client.js';

function fakeClient(text: string | undefined): GeminiClientLike {
  return {
    models: {
      generateContent: vi.fn().mockResolvedValue({ text }),
    },
  };
}

describe('GeminiSummaryClient.summarize', () => {
  it('calls generateContent with the model and a structured JSON request', async () => {
    const client = fakeClient(JSON.stringify({ title: 'T', content: 'C' }));
    const summary = new GeminiSummaryClient(client, 'gemini-3.7-flash');

    await summary.summarize({
      articleTitle: 'Title',
      articleSource: 'GitHub',
      sourceText: 'Body',
    });

    expect(client.models.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.7-flash',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
        }),
      }),
    );
  });

  it('parses the JSON response into a title and content', async () => {
    const client = fakeClient(JSON.stringify({ title: 'T', content: 'C' }));
    const summary = new GeminiSummaryClient(client, 'gemini-3.7-flash');

    const result = await summary.summarize({
      articleTitle: 'Title',
      articleSource: 'arXiv',
      sourceText: 'Body',
    });

    expect(result).toEqual({ title: 'T', content: 'C' });
  });

  it('throws when the model returns an empty response', async () => {
    const client = fakeClient(undefined);
    const summary = new GeminiSummaryClient(client, 'gemini-3.7-flash');

    await expect(
      summary.summarize({
        articleTitle: 'Title',
        articleSource: 'arXiv',
        sourceText: 'Body',
      }),
    ).rejects.toThrow('Empty response from model');
  });

  it('throws when the response is missing title or content', async () => {
    const client = fakeClient(JSON.stringify({ title: 'T' }));
    const summary = new GeminiSummaryClient(client, 'gemini-3.7-flash');

    await expect(
      summary.summarize({
        articleTitle: 'Title',
        articleSource: 'arXiv',
        sourceText: 'Body',
      }),
    ).rejects.toThrow('Model response missing title or content');
  });
});
