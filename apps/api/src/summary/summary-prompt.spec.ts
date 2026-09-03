import {
  buildSummaryPrompt,
  SUMMARY_RESPONSE_SCHEMA,
} from './summary-prompt.js';

describe('buildSummaryPrompt', () => {
  it('includes the title and source text', () => {
    const prompt = buildSummaryPrompt('Some Title', 'Some source text');

    expect(prompt).toContain('Some Title');
    expect(prompt).toContain('Some source text');
  });

  it('truncates very long source text so requests stay within size limits', () => {
    const longText = 'x'.repeat(50_000);
    const prompt = buildSummaryPrompt('Some Title', longText);

    expect(prompt.length).toBeLessThan(21_000);
  });
});

describe('SUMMARY_RESPONSE_SCHEMA', () => {
  it('requires a title and content field', () => {
    expect(SUMMARY_RESPONSE_SCHEMA.required).toEqual(['title', 'content']);
  });
});
