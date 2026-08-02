import { describe, expect, it } from '@rstest/core';

import type { KanbanCard } from '@synara-web/components/kanban/kanban.logic';
import {
  createNativeKanbanDragSession,
  isNativeKanbanPrimaryPointer,
  moveNativeKanbanDragSession,
  readNativeKanbanPointer,
  shouldCancelNativeKanbanDragKey,
} from './kanbanDnd.logic';

const card = { cardId: 'thread:a' } as KanbanCard;

describe('Native Kanban drag state', () => {
  it('normalizes PC mouse and touch page coordinates', () => {
    expect(readNativeKanbanPointer({ pageX: 12, pageY: 34 })).toEqual({ x: 12, y: 34 });
    expect(
      readNativeKanbanPointer({ touches: [{ pageX: 56, pageY: 78 }] })
    ).toEqual({ x: 56, y: 78 });
    expect(readNativeKanbanPointer({ detail: { x: 9, y: 10 } })).toEqual({ x: 9, y: 10 });
    expect(readNativeKanbanPointer({ detail: { clientX: 17, clientY: 18 } })).toEqual({
      x: 17,
      y: 18,
    });
    expect(
      readNativeKanbanPointer({
        clientX: 21,
        clientY: 22,
        pageX: 421,
        pageY: 422,
      })
    ).toEqual({ x: 21, y: 22 });
    expect(
      readNativeKanbanPointer({
        detail: { x: 31, y: 32 },
        pageX: 431,
        pageY: 432,
      })
    ).toEqual({ x: 31, y: 32 });
    expect(readNativeKanbanPointer({ clientX: 22, clientY: 33 })).toEqual({ x: 22, y: 33 });
    expect(readNativeKanbanPointer({ pageX: 12 })).toBeNull();
  });

  it('waits for six pixels, then throttles moves to one frame window', () => {
    const initial = createNativeKanbanDragSession(card, { x: 10, y: 10 }, 100);
    const armed = moveNativeKanbanDragSession({
      event: { pageX: 13, pageY: 14, buttons: 1 },
      now: 101,
      policy: null,
      session: initial,
    });
    expect(armed.kind).toBe('moved');
    if (armed.kind !== 'moved') throw new Error('expected moved drag');
    expect(armed.session.activated).toBe(false);
    const activated = moveNativeKanbanDragSession({
      event: { pageX: 20, pageY: 10, buttons: 1 },
      now: 102,
      policy: { kind: 'dispatch', label: 'Release to start task' },
      session: armed.session,
    });
    expect(activated.kind).toBe('moved');
    if (activated.kind !== 'moved') throw new Error('expected moved drag');
    expect(activated.session.activated).toBe(true);
    expect(
      moveNativeKanbanDragSession({
        event: { pageX: 30, pageY: 10, buttons: 1 },
        now: 103,
        policy: activated.session.policy,
        session: activated.session,
      }).kind
    ).toBe('ignored');
  });

  it('ends safely when a move reports no pressed button before throttle', () => {
    const session = createNativeKanbanDragSession(card, { x: 10, y: 10 }, 100);
    expect(
      moveNativeKanbanDragSession({
        event: { pageX: 30, pageY: 10, buttons: 0 },
        now: 101,
        policy: null,
        session,
      })
    ).toEqual({ kind: 'ended-missed-mouseup' });
  });

  it('recognizes primary pointers and Escape cancellation', () => {
    expect(isNativeKanbanPrimaryPointer({ button: 0 })).toBe(true);
    expect(isNativeKanbanPrimaryPointer({ button: 2 })).toBe(false);
    expect(shouldCancelNativeKanbanDragKey('Escape')).toBe(true);
    expect(shouldCancelNativeKanbanDragKey('Enter')).toBe(false);
  });
});
