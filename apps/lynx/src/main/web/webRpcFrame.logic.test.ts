import { describe, expect, it } from '@rstest/core';

import {
  describeWebRpcDefect,
  parseWebRpcResponse,
} from './webRpcFrame.logic';

describe('Lynx-for-Web RPC response frames', () => {
  it('recognizes request-scoped exits and chunks', () => {
    expect(
      parseWebRpcResponse(
        JSON.stringify({
          _tag: 'Exit',
          requestId: '1',
          exit: { _tag: 'Success', value: { ready: true } },
        })
      )
    ).toMatchObject({ _tag: 'Exit', requestId: '1' });
    expect(
      parseWebRpcResponse(
        JSON.stringify({
          _tag: 'Chunk',
          requestId: '2',
          values: [{ kind: 'progress' }],
        })
      )
    ).toMatchObject({ _tag: 'Chunk', requestId: '2' });
  });

  it('recognizes connection-level defects without a request id', () => {
    const frame = parseWebRpcResponse(
      JSON.stringify({
        _tag: 'Defect',
        defect: {
          message: 'Invalid PDF structure.',
          name: 'InvalidPDFException',
        },
      })
    );

    expect(frame).toMatchObject({ _tag: 'Defect' });
    expect(
      frame?._tag === 'Defect' ? describeWebRpcDefect(frame) : null
    ).toBe('InvalidPDFException: Invalid PDF structure.');
  });

  it('rejects malformed or unrelated frames', () => {
    expect(parseWebRpcResponse('not-json')).toBeNull();
    expect(parseWebRpcResponse(JSON.stringify({ _tag: 'Request' }))).toBeNull();
  });
});
