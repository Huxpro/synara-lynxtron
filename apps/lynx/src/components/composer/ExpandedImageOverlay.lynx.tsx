import { useEffect, type ReactNode } from '@lynx-js/react';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from '../../lib/icons.lynx';
import { useLynxInteractiveState } from '../../adapters/useLynxInteractiveState';
import { focusLynxElementBySelector } from '../ui/focus.lynx';

export interface NativeExpandedImagePreview {
  readonly images: ReadonlyArray<{
    readonly src: string;
    readonly name: string;
  }>;
  readonly index: number;
}

function ExpandedImageAction(props: {
  readonly accessibleLabel: string;
  readonly children: ReactNode;
  readonly className: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: props.className,
    accessibleLabel: props.accessibleLabel,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

export function ExpandedImageOverlay(props: {
  readonly expandedImage: NativeExpandedImagePreview | null;
  readonly onClose: () => void;
  readonly onNavigate: (direction: -1 | 1) => void;
}) {
  const item = props.expandedImage
    ? props.expandedImage.images[props.expandedImage.index]
    : null;
  useEffect(() => {
    'background only';
    if (item) {
      focusLynxElementBySelector('.ComposerExpandedImageOverlay');
    }
  }, [item]);
  if (!props.expandedImage || !item) return null;

  const hasMultipleImages = props.expandedImage.images.length > 1;
  const caption = hasMultipleImages
    ? `${item.name} (${props.expandedImage.index + 1}/${props.expandedImage.images.length})`
    : item.name;
  const handleKeyDown = (event: {
    readonly key: string;
    preventDefault?: () => void;
  }) => {
    'background only';
    if (event.key === 'Escape') {
      event.preventDefault?.();
      props.onClose();
      return;
    }
    if (!hasMultipleImages) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault?.();
      props.onNavigate(-1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault?.();
      props.onNavigate(1);
    }
  };

  return (
    <view
      className="ComposerExpandedImageOverlay"
      focusable={true}
      bindkeydown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Expanded image preview"
    >
      <ExpandedImageAction
        className="ComposerExpandedImageBackdrop"
        accessibleLabel="Close image preview"
        onActivate={props.onClose}
      >
        <view className="ComposerExpandedImageBackdropFill" />
      </ExpandedImageAction>
      {hasMultipleImages ? (
        <ExpandedImageAction
          className="ComposerExpandedImageNavigate ComposerExpandedImageNavigate--previous"
          accessibleLabel="Previous image"
          onActivate={() => props.onNavigate(-1)}
        >
          <ChevronLeftIcon
            className="ComposerExpandedImageNavigateIcon"
            color="rgba(255, 255, 255, 0.9)"
            size={20}
          />
        </ExpandedImageAction>
      ) : null}
      <view className="ComposerExpandedImageContent">
        <view className="ComposerExpandedImageFrame">
          <image
            className="ComposerExpandedImage"
            src={item.src}
            mode="aspectFit"
            accessibility-element={true}
            accessibility-label={item.name}
          />
          <ExpandedImageAction
            className="ComposerExpandedImageClose"
            accessibleLabel="Close image preview"
            onActivate={props.onClose}
          >
            <XIcon
              className="ComposerExpandedImageCloseIcon"
              color="var(--foreground)"
              size={16}
            />
          </ExpandedImageAction>
        </view>
        <text className="ComposerExpandedImageName">{caption}</text>
      </view>
      {hasMultipleImages ? (
        <ExpandedImageAction
          className="ComposerExpandedImageNavigate ComposerExpandedImageNavigate--next"
          accessibleLabel="Next image"
          onActivate={() => props.onNavigate(1)}
        >
          <ChevronRightIcon
            className="ComposerExpandedImageNavigateIcon"
            color="rgba(255, 255, 255, 0.9)"
            size={20}
          />
        </ExpandedImageAction>
      ) : null}
    </view>
  );
}
