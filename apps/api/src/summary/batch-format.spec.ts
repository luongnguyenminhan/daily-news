import { buildBatchRequestLine, parseBatchResultLine } from './batch-format.js';

describe('buildBatchRequestLine', () => {
  it('embeds the article id as the batch key', () => {
    const line = buildBatchRequestLine(
      'article-1',
      'Some Title',
      'Some source text',
    );
    const parsed = JSON.parse(line);

    expect(parsed.key).toBe('article-1');
  });

  it('includes the title and source text in the prompt', () => {
    const line = buildBatchRequestLine(
      'article-1',
      'Some Title',
      'Some source text',
    );
    const parsed = JSON.parse(line);
    const promptText = parsed.request.contents[0].parts[0].text;

    expect(promptText).toContain('Some Title');
    expect(promptText).toContain('Some source text');
  });

  it('requests a structured JSON title/content response', () => {
    const line = buildBatchRequestLine(
      'article-1',
      'Some Title',
      'Some source text',
    );
    const parsed = JSON.parse(line);

    expect(parsed.request.generation_config.response_mime_type).toBe(
      'application/json',
    );
    expect(parsed.request.generation_config.response_schema.required).toEqual([
      'title',
      'content',
    ]);
  });

  it('truncates very long source text so requests stay within size limits', () => {
    const longText = 'x'.repeat(50_000);
    const line = buildBatchRequestLine('article-1', 'Some Title', longText);
    const parsed = JSON.parse(line);
    const promptText = parsed.request.contents[0].parts[0].text;

    expect(promptText.length).toBeLessThan(21_000);
  });
});

describe('parseBatchResultLine', () => {
  it('parses a successful result into title and content', () => {
    const line = JSON.stringify({
      key: 'article-1',
      response: {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ title: 'T', content: 'C' }) }],
            },
          },
        ],
      },
    });

    expect(parseBatchResultLine(line)).toEqual({
      key: 'article-1',
      title: 'T',
      content: 'C',
    });
  });

  it('surfaces a top-level batch error', () => {
    const line = JSON.stringify({
      key: 'article-1',
      error: { message: 'quota exceeded' },
    });

    expect(parseBatchResultLine(line)).toEqual({
      key: 'article-1',
      error: 'quota exceeded',
    });
  });

  it('errors when the model response is not valid JSON', () => {
    const line = JSON.stringify({
      key: 'article-1',
      response: {
        candidates: [{ content: { parts: [{ text: 'not json' }] } }],
      },
    });

    expect(parseBatchResultLine(line).error).toBe(
      'Could not parse model response as JSON',
    );
  });
});
