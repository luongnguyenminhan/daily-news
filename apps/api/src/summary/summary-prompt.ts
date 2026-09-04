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
  articleSource: string,
  sourceText: string,
): string {
  const sourceInstructions =
    articleSource === 'GitHub'
      ? [
          'This is a GitHub repository. Explain what it does, who it is for,',
          'its notable capabilities, and any practical constraints or setup',
          'details supported by the README.',
        ]
      : [
          'This is a paper or article. Explain the problem, approach, key',
          'findings, and why the work matters, using only supported claims.',
        ];

  return [
    'You are writing a description for a research and developer news digest.',
    'Write a short, punchy title (max 12 words).',
    'Write a clear, standalone plain-text description in 2–4 sentences',
    '(80–120 words). Do not use Markdown, headings, lists, or labels.',
    ...sourceInstructions,
    'Do not invent facts that are not in the source text.',
    '',
    `Original title: ${articleTitle}`,
    `Source: ${articleSource}`,
    '',
    'Source text:',
    sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH),
  ].join('\n');
}
