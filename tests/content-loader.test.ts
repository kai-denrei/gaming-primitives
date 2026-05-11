import { describe, it, expect } from 'vitest';
import { loadExtras } from '../src/lib/content-loader';

describe('loadExtras', () => {
  it('returns research and spec for a primitive with all three files', () => {
    const extras = loadExtras('__test__');
    expect(extras.research?.rawContent).toMatch(/Research body/);
    expect(extras.spec?.rawContent).toMatch(/Spec body/);
  });

  it('returns empty object for unknown id', () => {
    const extras = loadExtras('does-not-exist');
    expect(extras.research).toBeUndefined();
    expect(extras.spec).toBeUndefined();
  });
});
