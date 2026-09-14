import sendArrowSvg from '@synara-central-icons/arrow-up.svg?raw';
import { COMPOSER_VOICE_LABELS } from '@synara-web/components/chat/composerVoiceLabels';

import { MicIcon } from '../../lib/icons.lynx';
import { colorizeLynxSvg } from '../../lib/themedSvg.lynx';
import { useTheme } from '../../adapters/useTheme.lynx';
import { useLynxInteractiveState } from '../../adapters/useLynxInteractiveState';
import { voiceWaveformBarHeight } from './composerVoiceWaveform.logic';
import { Spinner } from '../ui/spinner.lynx';

const WAVEFORM_MAX_SAMPLES = 160;

export function ComposerVoiceButton(props: {
  readonly disabled: boolean;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerVoiceButtonLynx${props.disabled ? ' ComposerVoiceButtonLynx--disabled' : ''}`,
    accessibleLabel: COMPOSER_VOICE_LABELS.record,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <MicIcon
        className="ComposerVoiceIconLynx"
        color={semanticIconColor('secondary')}
        size={16}
      />
    </view>
  );
}

export function ComposerVoiceRecorderBar(props: {
  readonly durationLabel: string;
  readonly waveformLevels: readonly number[];
  readonly transcribing: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
}) {
  const { svgColors } = useTheme();
  const cancel = useLynxInteractiveState({
    baseClassName: 'ComposerVoiceRoundActionLynx ComposerVoiceCancelLynx',
    accessibleLabel: props.transcribing
      ? COMPOSER_VOICE_LABELS.transcribing
      : COMPOSER_VOICE_LABELS.stopAndTranscribe,
    disabled: props.transcribing,
    onActivate: props.onCancel,
  });
  const submit = useLynxInteractiveState({
    baseClassName: 'ComposerVoiceRoundActionLynx ComposerVoiceSubmitLynx',
    accessibleLabel: props.transcribing
      ? COMPOSER_VOICE_LABELS.transcribing
      : COMPOSER_VOICE_LABELS.send,
    disabled: props.transcribing,
    onActivate: props.onSubmit,
  });
  return (
    <view className="ComposerVoiceRecorderBarLynx">
      <view className="ComposerVoiceWaveformLynx">
        <view className="ComposerVoiceWaveformBaselineLynx" />
        <view className="ComposerVoiceWaveformBarsLynx">
          {props.waveformLevels.slice(-WAVEFORM_MAX_SAMPLES).map((level, index) => (
            <view
              key={index}
              className={`ComposerVoiceWaveformBarLynx${props.transcribing ? ' ComposerVoiceWaveformBarLynx--transcribing' : ''}`}
              style={{ height: `${voiceWaveformBarHeight(level)}px` }}
            />
          ))}
        </view>
      </view>
      <text className="ComposerVoiceDurationLynx">{props.durationLabel}</text>
      <view className={cancel.className} {...cancel.eventProps}>
        {props.transcribing ? (
          <Spinner className="ComposerVoiceSpinnerLynx ComposerVoiceSpinnerLynx--secondary" size={10} />
        ) : (
          <view className="ComposerVoiceStopGlyphLynx ComposerVoiceStopGlyphLynx--secondary" />
        )}
      </view>
      <view className={submit.className} {...submit.eventProps}>
        {props.transcribing ? (
          <Spinner className="ComposerVoiceSpinnerLynx" size={10} />
        ) : (
          <svg
            className="ComposerVoiceSubmitIconLynx"
            content={colorizeLynxSvg(sendArrowSvg, svgColors.surface)}
          />
        )}
      </view>
    </view>
  );
}
