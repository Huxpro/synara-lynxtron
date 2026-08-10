import type { PullRequestActor } from '@synara/contracts';
import { useState } from '@lynx-js/react';

import './pull-request-actor-label.css';

function initialFor(actor: PullRequestActor | null): string {
  const source = actor?.name?.trim() || actor?.login?.trim();
  return source ? source.slice(0, 1).toUpperCase() : '?';
}

export function PullRequestActorLabel(props: {
  readonly actor: PullRequestActor | null;
  readonly variant: 'author' | 'comment' | 'reviewer';
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const login = props.actor?.login?.trim() || 'ghost';
  const src = props.actor?.avatarUrl?.trim() || null;
  return (
    <view
      className={`SharedPrActorLabel SharedPrActorLabel--${props.variant}`}
      accessibility-element={true}
      accessibility-label={login}
    >
      {src && src !== failedSrc ? (
        <image
          className="SharedPrActorAvatar"
          src={src}
          mode="aspectFill"
          accessibility-element={false}
          binderror={() => {
            'background only';
            setFailedSrc(src);
          }}
        />
      ) : (
        <view
          className="SharedPrActorAvatar SharedPrActorAvatar--fallback"
          accessibility-element={false}
        >
          <text className="SharedPrActorAvatarInitial">
            {initialFor(props.actor)}
          </text>
        </view>
      )}
      <text className="SharedPrActorLogin">{login}</text>
    </view>
  );
}
