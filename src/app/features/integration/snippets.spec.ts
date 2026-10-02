import { embedSnippet, formUrl } from './snippets';

describe('integration snippets', () => {
  it('builds the form URL, encoding the source', () => {
    expect(formUrl('https://panel.x', ' verano 2026 ')).toBe('https://panel.x/f/verano%202026');
    expect(formUrl('https://panel.x', '')).toBe('https://panel.x/f/web');
  });

  it('embeds the form URL as a string literal', () => {
    expect(embedSnippet('https://panel.x/f/web')).toContain(
      'var src = new URL("https://panel.x/f/web");',
    );
  });
});
