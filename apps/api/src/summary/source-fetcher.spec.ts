import { fetchSourceText } from './source-fetcher.js';

function fakeResponse(body: string, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(body),
  } as Response;
}

describe('fetchSourceText', () => {
  it('fetches the raw README for a GitHub article', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse('# Hello repo'));

    const text = await fetchSourceText(
      {
        title: 'org/repo',
        url: 'https://github.com/org/repo',
        source: 'GitHub',
      },
      fetchImpl,
    );

    expect(text).toBe('# Hello repo');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.github.com/repos/org/repo/readme',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.github.raw',
        }),
      }),
    );
  });

  it('extracts the main readable text from a webpage', async () => {
    const paragraph =
      '<p>' +
      'Paragraph text with enough words to look like a real article. '.repeat(
        10,
      ) +
      '</p>';
    const html = `<!doctype html><html><head><title>Big News</title></head><body>
      <article><h1>Big News</h1>${paragraph.repeat(3)}</article>
    </body></html>`;
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(html));

    const text = await fetchSourceText(
      {
        title: 'Big News',
        url: 'https://example.com/article',
        source: 'Example',
      },
      fetchImpl,
    );

    expect(text).toContain('Paragraph text with enough words');
  });

  it('falls back to the title when the fetch fails', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse('', false, 500));

    const text = await fetchSourceText(
      {
        title: 'Fallback Title',
        url: 'https://example.com/broken',
        source: 'Example',
      },
      fetchImpl,
    );

    expect(text).toBe('Fallback Title');
  });

  it('falls back to the title when the fetch throws', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));

    const text = await fetchSourceText(
      {
        title: 'Fallback Title',
        url: 'https://example.com/broken',
        source: 'Example',
      },
      fetchImpl,
    );

    expect(text).toBe('Fallback Title');
  });
});
