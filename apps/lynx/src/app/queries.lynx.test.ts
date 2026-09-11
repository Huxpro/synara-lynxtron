import { describe, expect, it, rs } from '@rstest/core';

const readProjectFileWithSyntax = rs.fn();

rs.mock('../data/synaraClient', () => ({
  readProjectFileWithSyntax,
}));

describe('explorer file query cache', () => {
  it('evicts a rejected read so the same file can be retried', async () => {
    const { fetchExplorerFile } = await import('./queries');
    const input = {
      workspaceRoot: '/workspace',
      relativePath: 'src/recovered.ts',
    };
    const recovered = {
      file: { contents: 'export const recovered = true;', truncated: false },
      syntaxHighlight: null,
    };

    readProjectFileWithSyntax
      .mockRejectedValueOnce(new Error('ENOENT'))
      .mockResolvedValueOnce(recovered);

    await expect(fetchExplorerFile(input)).rejects.toThrow('ENOENT');
    await expect(fetchExplorerFile(input)).resolves.toEqual(recovered);
    expect(readProjectFileWithSyntax).toHaveBeenCalledTimes(2);
  });
});
