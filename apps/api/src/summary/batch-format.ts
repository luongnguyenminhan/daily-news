export interface BatchSummaryResult {
  key: string;
  title?: string;
  content?: string;
  error?: string;
}

const MAX_SOURCE_TEXT_LENGTH = 20_000;

export function buildBatchRequestLine(
  articleId: string,
  articleTitle: string,
  sourceText: string,
): string {
  const request = {
    key: articleId,
    request: {
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(articleTitle, sourceText) }],
        },
      ],
      generation_config: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            content: { type: 'STRING' },
          },
          required: ['title', 'content'],
        },
      },
    },
  };

  return JSON.stringify(request);
}

function buildPrompt(articleTitle: string, sourceText: string): string {
  return [
    'You are summarizing a crawled article or GitHub repository for a news digest.',
    'Write a short, punchy title (max 12 words) and a summary body of 2-4 short',
    'paragraphs covering the key points, based only on the source text below.',
    'Do not invent facts that are not in the source text.',
    '',
    `Original title: ${articleTitle}`,
    '',
    'Source text:',
    sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH),
  ].join('\n');
}

export function parseBatchResultLine(line: string): BatchSummaryResult {
  const parsed = JSON.parse(line);
  const key = parsed.key as string;

  if (parsed.error) {
    return { key, error: parsed.error.message ?? 'Unknown batch error' };
  }

  const responseText =
    parsed.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    return { key, error: 'Empty response from model' };
  }

  try {
    const summary = JSON.parse(responseText);
    return { key, title: summary.title, content: summary.content };
  } catch {
    return { key, error: 'Could not parse model response as JSON' };
  }
}
