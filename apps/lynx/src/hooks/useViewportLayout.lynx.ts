import {
  useCallback,
  useEffect,
  useLynxGlobalEventListener,
  useState,
} from '@lynx-js/react';

import {
  resolveViewportLayout,
  UNKNOWN_VIEWPORT_SIZE,
  type ViewportLayout,
  type ViewportSize,
} from '@synara-web/responsiveLayout.logic';
import { platformWindow } from '../platform/window';

function validViewportSize(width: unknown, height: unknown): ViewportSize | null {
  if (
    typeof width !== 'number' ||
    !Number.isFinite(width) ||
    width <= 0 ||
    typeof height !== 'number' ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return null;
  }
  return { width, height };
}

export function useViewportLayout(): ViewportLayout {
  const [size, setSize] = useState<ViewportSize>(UNKNOWN_VIEWPORT_SIZE);
  const update = useCallback((width: unknown, height: unknown) => {
    const next = validViewportSize(width, height);
    if (!next) return;
    setSize((current) =>
      current.width === next.width && current.height === next.height
        ? current
        : next
    );
  }, []);

  useLynxGlobalEventListener('onWindowResize', update);

  useEffect(() => {
    'background only';
    let active = true;
    void platformWindow
      .getViewportSize()
      .then((viewport) => {
        if (active && viewport) update(viewport.width, viewport.height);
      })
      .catch(() => {
        // Keep the unknown responsive layout until either resize channel
        // delivers the first valid viewport.
      });
    const unsubscribe = platformWindow.onViewportResize((viewport) => {
      update(viewport.width, viewport.height);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [update]);

  return resolveViewportLayout(size);
}
