import { Type } from '@google/genai';
import type { Schema } from '@google/genai';

const MAX_SOURCE_TEXT_LENGTH = 20_000;

export const SUMMARY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING },
  },
  required: ['title', 'content'],
};

export function buildSummaryPrompt(
  articleTitle: string,
  sourceText: string,
): string {
  return [
    'You are summarizing a crawled article or GitHub repository for a news digest.',
    'Write a short, punchy title (max 12 words).',
    'Write the body as detailed Markdown, at least 300 words, covering the key',
    'points, context, and implications, based only on the source text below.',
    'Use Markdown formatting where it helps readability (paragraphs, headers,',
    'bullet or numbered lists, bold/italic emphasis).',
    'Do not invent facts that are not in the source text.',
    '',
    `Original title: ${articleTitle}`,
    '',
    'Source text:',
    sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH),
  ].join('\n');
}
