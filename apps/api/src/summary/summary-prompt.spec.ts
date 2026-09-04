import {
  buildSummaryPrompt,
  SUMMARY_RESPONSE_SCHEMA,
} from './summary-prompt.js';

describe('buildSummaryPrompt', () => {
  it('includes the title and source text', () => {
    const prompt = buildSummaryPrompt(
      'Some Title',
      'arXiv',
      'Some source text',
    );

    expect(prompt).toContain('Some Title');
    expect(prompt).toContain('Some source text');
  });

  it('truncates very long source text so requests stay within size limits', () => {
    const longText = 'x'.repeat(50_000);
    const prompt = buildSummaryPrompt('Some Title', 'arXiv', longText);

    expect(prompt.length).toBeLessThan(21_000);
  });

  it('uses repository-specific instructions for GitHub sources', () => {
    const prompt = buildSummaryPrompt('owner/repo', 'GitHub', 'README text');

    expect(prompt).toContain('GitHub repository');
  });
});

describe('SUMMARY_RESPONSE_SCHEMA', () => {
  it('requires a title and content field', () => {
    expect(SUMMARY_RESPONSE_SCHEMA.required).toEqual(['title', 'content']);
  });
});
