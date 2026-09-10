import { COMPONENT_LAB_STORIES, validateComponentLabStories } from '@synara/shared/componentLab';

import './components-lab.css';
import { ComponentsLabStoryRendererLynx } from './ComponentsLabStoryRenderer.lynx';

export function ComponentsLabPageLynx(props: {
  readonly embedded?: boolean;
  readonly selectedState?: string | null;
  readonly selectedStoryId?: string | null;
  readonly selectedVariant?: string | null;
  readonly onSelectStory: (storyId: string) => void;
  readonly onSelectState: (state: string) => void;
  readonly onSelectVariant: (variant: string) => void;
}) {
  const errors = validateComponentLabStories(COMPONENT_LAB_STORIES);
  const story = COMPONENT_LAB_STORIES.find((item) => item.id === props.selectedStoryId) ?? COMPONENT_LAB_STORIES[0];
  const state = story?.states.includes(props.selectedState ?? '') ? props.selectedState! : 'default';
  const variant = story?.variants.includes(props.selectedVariant ?? '') ? props.selectedVariant! : story?.variants[0] ?? 'default';
  if (props.embedded) {
    return story ? (
      <view className="ComponentsLabEmbedded" data-component-lab-story={story.id}>
        <ComponentsLabStoryRendererLynx
          key={`${story.id}:${variant}:${state}`}
          storyId={story.id}
          state={state}
          variant={variant}
        />
      </view>
    ) : null;
  }
  return (
    <view className="ComponentsLab">
      <scroll-view className="ComponentsLabSidebar" scroll-orientation="vertical">
        <view className="ComponentsLabSidebarContent">
          <view className="ComponentsLabSidebarHeader AppWindowDragRegion">
            <text className="ComponentsLabTitle">Components Lab</text>
            <text className="ComponentsLabMeta">lynx · {COMPONENT_LAB_STORIES.length} stories</text>
          </view>
          {COMPONENT_LAB_STORIES.map((item) => (
            <view
              key={item.id}
              className={`ComponentsLabStoryLink${item.id === story?.id ? ' ComponentsLabStoryLink--active' : ''}`}
              accessibility-element
              accessibility-label={`Show ${item.title}`}
              accessibility-role="button"
              accessibility-state={{ selected: item.id === story?.id }}
              focusable
              bindtap={() => props.onSelectStory(item.id)}
            >
              <text className="ComponentsLabStoryTitle">{item.title}</text>
              <text className="ComponentsLabStoryId">{item.id}</text>
            </view>
          ))}
        </view>
      </scroll-view>
      <scroll-view className="ComponentsLabMain" scroll-orientation="vertical">
        <view className="ComponentsLabMainDragRegion AppWindowDragRegion" />
        {errors.length > 0 ? <text className="ComponentsLabError">{errors.join(' · ')}</text> : story ? (
          <view className="ComponentsLabStory" data-component-lab-story={story.id}>
            <text className="ComponentsLabCategory">{story.category}</text>
            <text className="ComponentsLabHeading">{story.title}</text>
            <text className="ComponentsLabMeta">owner: {story.owner} · fixture: {story.fixtureId}</text>
            <view className="ComponentsLabStates">{story.variants.map((item) => <view key={item} accessibility-element accessibility-role="button" accessibility-label={`Show ${item} variant`} accessibility-state={{ selected: item === variant }} focusable className={`ComponentsLabState${item === variant ? ' ComponentsLabState--active' : ''}`} bindtap={() => props.onSelectVariant(item)}><text>{item}</text></view>)}</view>
            <view className="ComponentsLabStates">{story.states.map((item) => <view key={item} accessibility-element accessibility-role="button" accessibility-label={`Show ${item} state`} accessibility-state={{ selected: item === state }} focusable className={`ComponentsLabState${item === state ? ' ComponentsLabState--active' : ''}`} bindtap={() => props.onSelectState(item)}><text>{item}</text></view>)}</view>
            <view className="ComponentsLabEntries">{(['electron', 'lynx'] as const).map((renderer) => { const entry = story.renderers[renderer]; return <view key={renderer} className="ComponentsLabEntry"><text className="ComponentsLabEntryRenderer">{renderer}</text><text className="ComponentsLabEntryComponent">{entry.component}</text><text className="ComponentsLabMeta">{entry.module}</text><text className="ComponentsLabMeta">{entry.consumers.join(' · ')}</text></view>; })}</view>
            <view className="ComponentsLabRenderTarget"><ComponentsLabStoryRendererLynx key={`${story.id}:${variant}:${state}`} storyId={story.id} state={state} variant={variant} /></view>
          </view>
        ) : null}
      </scroll-view>
    </view>
  );
}
