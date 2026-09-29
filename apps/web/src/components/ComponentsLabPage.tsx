import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMPONENT_LAB_IMPLEMENTED_STORY_IDS,
  COMPONENT_LAB_RELAY_STORAGE_KEY,
  COMPONENT_LAB_STORIES,
  componentLabCases,
  isComponentLabStoryImplemented,
  validateComponentLabStories,
} from "@synara/shared/componentLab";
import { getDesktopBridge } from "~/platform/desktopBridge";
import { sessionWebStorage } from "~/platform/storage";
import { CopyIcon, MoonIcon, PlayIcon, SearchIcon, StopIcon, SunIcon, XIcon } from "~/lib/icons";
import { useTheme } from "~/hooks/useTheme";
import { DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CLASS } from "~/hooks/useDesktopTopBarGutter";
import { ComponentsLabStoryRenderer } from "./ComponentsLabStoryRenderer";

interface ComponentsLabPageProps {
  readonly embedded?: boolean;
  readonly renderer: "electron" | "lynx";
  readonly selectedState?: string | null;
  readonly selectedVariant?: string | null;
  readonly selectedStoryId?: string | null;
  readonly onSelectStory?: (storyId: string) => void;
  readonly onSelectState?: (state: string) => void;
  readonly onSelectVariant?: (variant: string) => void;
}

export function ComponentsLabPage(props: ComponentsLabPageProps) {
  const [query, setQuery] = useState("");
  const [electronScreenshot, setElectronScreenshot] = useState<string | null>(null);
  const [lynxScreenshot, setLynxScreenshot] = useState<string | null>(null);
  const [automationIndex, setAutomationIndex] = useState<number | null>(null);
  const [lynxRelayReady] = useState(() => {
    if (props.embedded) return true;
    const bridgeUrl = getDesktopBridge()?.getWsUrl?.();
    const buildUrl = import.meta.env.VITE_WS_URL as string | undefined;
    const relayUrl = bridgeUrl?.trim() || buildUrl?.trim() || "";
    if (relayUrl) {
      sessionWebStorage.setItem(COMPONENT_LAB_RELAY_STORAGE_KEY, relayUrl);
    } else {
      sessionWebStorage.removeItem(COMPONENT_LAB_RELAY_STORAGE_KEY);
    }
    return true;
  });
  const electronScreenshotInputRef = useRef<HTMLInputElement>(null);
  const lynxScreenshotInputRef = useRef<HTMLInputElement>(null);
  const screenshotUrlsRef = useRef<{ electron: string | null; lynx: string | null }>({
    electron: null,
    lynx: null,
  });
  const { resolvedTheme, setTheme } = useTheme();
  const manifestErrors = validateComponentLabStories(COMPONENT_LAB_STORIES);
  const visibleStories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery.length === 0
      ? COMPONENT_LAB_STORIES
      : COMPONENT_LAB_STORIES.filter((story) =>
          `${story.title} ${story.id} ${story.category} ${story.owner}`
            .toLowerCase()
            .includes(normalizedQuery),
        );
  }, [query]);
  const selectedStory =
    COMPONENT_LAB_STORIES.find((story) => story.id === props.selectedStoryId) ??
    COMPONENT_LAB_STORIES[0];
  const selectedState = selectedStory?.states.includes(props.selectedState ?? "")
    ? props.selectedState!
    : "default";
  const selectedVariant = selectedStory?.variants.includes(props.selectedVariant ?? "")
    ? props.selectedVariant!
    : (selectedStory?.variants[0] ?? "default");
  const lynxStoryRoute = `/components-lab?story=${encodeURIComponent(
    selectedStory?.id ?? "",
  )}&state=${encodeURIComponent(selectedState)}&variant=${encodeURIComponent(selectedVariant)}&embed=1`;
  // Vite owns the Web-only Lynx relay at /lynx. Keeping this same-origin avoids
  // a user-facing port contract and lets the desktop comparison harness inject
  // the exact isolated server URL into the generated host document.
  const lynxPreviewUrl = `/lynx/?route=${encodeURIComponent(lynxStoryRoute)}&theme=${resolvedTheme}`;
  const electronPreviewUrl = `/#/components-lab?story=${encodeURIComponent(
    selectedStory?.id ?? "",
  )}&state=${encodeURIComponent(selectedState)}&variant=${encodeURIComponent(selectedVariant)}&embed=electron`;

  useEffect(
    () => () => {
      if (screenshotUrlsRef.current.electron) {
        URL.revokeObjectURL(screenshotUrlsRef.current.electron);
      }
      if (screenshotUrlsRef.current.lynx) {
        URL.revokeObjectURL(screenshotUrlsRef.current.lynx);
      }
    },
    [],
  );

  const loadScreenshot = (renderer: "electron" | "lynx", file: File | undefined) => {
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    if (renderer === "electron") {
      if (screenshotUrlsRef.current.electron) {
        URL.revokeObjectURL(screenshotUrlsRef.current.electron);
      }
      screenshotUrlsRef.current.electron = nextUrl;
      setElectronScreenshot(nextUrl);
      return;
    }
    if (screenshotUrlsRef.current.lynx) URL.revokeObjectURL(screenshotUrlsRef.current.lynx);
    screenshotUrlsRef.current.lynx = nextUrl;
    setLynxScreenshot(nextUrl);
  };

  const clearScreenshots = () => {
    if (screenshotUrlsRef.current.electron) {
      URL.revokeObjectURL(screenshotUrlsRef.current.electron);
    }
    if (screenshotUrlsRef.current.lynx) URL.revokeObjectURL(screenshotUrlsRef.current.lynx);
    screenshotUrlsRef.current = { electron: null, lynx: null };
    setElectronScreenshot(null);
    setLynxScreenshot(null);
    if (electronScreenshotInputRef.current) electronScreenshotInputRef.current.value = "";
    if (lynxScreenshotInputRef.current) lynxScreenshotInputRef.current.value = "";
  };

  useEffect(() => {
    if (automationIndex === null || !selectedStory) return;
    const cases = componentLabCases(selectedStory);
    const target = cases[automationIndex];
    if (!target) {
      setAutomationIndex(null);
      return;
    }
    if (target.variant !== selectedVariant) {
      props.onSelectVariant?.(target.variant);
      return;
    }
    if (target.state !== selectedState) {
      props.onSelectState?.(target.state);
      return;
    }
    if (automationIndex >= cases.length - 1) {
      const timeoutId = setTimeout(() => setAutomationIndex(null), 900);
      return () => clearTimeout(timeoutId);
    }
    const timeoutId = setTimeout(() => setAutomationIndex(automationIndex + 1), 900);
    return () => clearTimeout(timeoutId);
  }, [
    automationIndex,
    props.onSelectState,
    props.onSelectVariant,
    selectedState,
    selectedStory,
    selectedVariant,
  ]);

  if (props.embedded) {
    return selectedStory ? (
      <div
        className="flex h-full min-h-[320px] items-center justify-center bg-[var(--color-background-elevated-primary-opaque)] p-4"
        data-component-lab-story={selectedStory.id}
      >
        <ComponentsLabStoryRenderer
          storyId={selectedStory.id}
          state={selectedState}
          variant={selectedVariant}
        />
      </div>
    ) : null;
  }

  return (
    <div
      data-component-lab-host={props.renderer}
      className="flex h-full min-h-0 flex-col bg-[var(--color-background-surface-under)] text-foreground"
    >
      <header
        className={`drag-region flex h-12 shrink-0 items-center gap-4 border-b border-border px-4 ${DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CLASS}`}
      >
        <div className="flex w-52 shrink-0 items-baseline gap-2">
          <h1 className="text-sm font-semibold">Components Lab</h1>
          <span className="text-[10px] text-muted-foreground">
            {COMPONENT_LAB_IMPLEMENTED_STORY_IDS.length}/{COMPONENT_LAB_STORIES.length}
          </span>
        </div>
        <label className="mx-auto flex h-8 w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-muted-foreground focus-within:ring-1 focus-within:ring-ring">
          <SearchIcon className="size-3.5 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components"
            aria-label="Search components"
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex w-52 shrink-0 justify-end">
          <button
            type="button"
            aria-label={`Use ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <SunIcon className="size-3.5" />
            ) : (
              <MoonIcon className="size-3.5" />
            )}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-auto border-r border-border bg-[var(--color-background-sidebar)] p-3">
          <nav className="space-y-1" aria-label="Component stories">
            {visibleStories.map((story) => {
              const implemented = isComponentLabStoryImplemented(story.id);
              return (
                <button
                  key={story.id}
                  type="button"
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    story.id === selectedStory?.id
                      ? "bg-[var(--color-background-button-secondary-hover)] text-foreground"
                      : "text-muted-foreground hover:bg-[var(--color-background-button-secondary-hover)] hover:text-foreground"
                  }`}
                  onClick={() => props.onSelectStory?.(story.id)}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium">{story.title}</span>
                    <span
                      aria-label={implemented ? "Live story" : "Planned story"}
                      className={`size-1.5 shrink-0 rounded-full ${implemented ? "bg-[var(--status-success)]" : "bg-muted-foreground/35"}`}
                    />
                  </span>
                  <span className="block truncate text-[10px] opacity-70">{story.id}</span>
                </button>
              );
            })}
            {visibleStories.length === 0 ? (
              <p className="px-2 py-5 text-xs text-muted-foreground">No matching components</p>
            ) : null}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto p-4">
          {manifestErrors.length > 0 ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {manifestErrors.join(" · ")}
            </div>
          ) : selectedStory ? (
            <article className="min-w-[640px]" data-component-lab-story={selectedStory.id}>
              <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex flex-wrap gap-1.5" aria-label="Story variants">
                  {selectedStory.variants.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      aria-pressed={variant === selectedVariant}
                      className={`rounded-md px-2.5 py-1 text-xs ${variant === selectedVariant ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                      onClick={() => props.onSelectVariant?.(variant)}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Story states">
                  {selectedStory.states.map((state) => (
                    <button
                      key={state}
                      type="button"
                      aria-pressed={state === selectedState}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring ${state === selectedState ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      onClick={() => props.onSelectState?.(state)}
                    >
                      {state}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={
                      automationIndex === null
                        ? "Run all story variants and states"
                        : "Stop story case run"
                    }
                    className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setAutomationIndex((current) => (current === null ? 0 : null))}
                  >
                    {automationIndex === null ? (
                      <PlayIcon className="size-3" />
                    ) : (
                      <StopIcon className="size-3" />
                    )}
                    {automationIndex === null
                      ? "Run cases"
                      : `Case ${automationIndex + 1}/${componentLabCases(selectedStory).length}`}
                  </button>
                  <input
                    ref={electronScreenshotInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Upload Electron screenshot"
                    onChange={(event) => loadScreenshot("electron", event.target.files?.[0])}
                  />
                  <input
                    ref={lynxScreenshotInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Upload Lynx screenshot"
                    onChange={(event) => loadScreenshot("lynx", event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => electronScreenshotInputRef.current?.click()}
                  >
                    <CopyIcon className="size-3" /> Electron screenshot
                  </button>
                  <button
                    type="button"
                    className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => lynxScreenshotInputRef.current?.click()}
                  >
                    <CopyIcon className="size-3" /> Lynx screenshot
                  </button>
                  {electronScreenshot || lynxScreenshot ? (
                    <button
                      type="button"
                      aria-label="Clear screenshots"
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={clearScreenshots}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
              <section>
                <div className="mt-4 grid grid-cols-2 gap-3" data-component-lab-render-target>
                  <section
                    className="min-w-0 overflow-hidden rounded-xl border border-border bg-[var(--color-background-elevated-primary-opaque)]"
                    data-component-lab-renderer="electron"
                  >
                    <header className="flex h-9 items-center justify-between border-b border-border px-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Electron
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {electronScreenshot ? "Screenshot" : "Live reference"}
                      </span>
                    </header>
                    <div className="flex h-[calc(100vh-141px)] min-h-[520px] items-center justify-center overflow-hidden p-4">
                      {electronScreenshot ? (
                        <img
                          src={electronScreenshot}
                          alt="Electron comparison screenshot"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <iframe
                          key={electronPreviewUrl}
                          title={`Electron preview: ${selectedStory.title} · ${selectedState}`}
                          src={electronPreviewUrl}
                          className="h-full w-full border-0 bg-transparent"
                        />
                      )}
                    </div>
                  </section>
                  <section
                    className="min-w-0 overflow-hidden rounded-xl border border-border bg-[var(--color-background-elevated-primary-opaque)]"
                    data-component-lab-renderer="lynx"
                  >
                    <header className="flex h-9 items-center justify-between border-b border-border px-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Lynx
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {lynxScreenshot ? "Screenshot" : "Live renderer"}
                      </span>
                    </header>
                    {lynxScreenshot ? (
                      <div className="flex h-[calc(100vh-141px)] min-h-[520px] items-center justify-center overflow-hidden p-4">
                        <img
                          src={lynxScreenshot}
                          alt="Lynx comparison screenshot"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : lynxRelayReady ? (
                      <iframe
                        key={lynxPreviewUrl}
                        title={`Lynx preview: ${selectedStory.title} · ${selectedState}`}
                        src={lynxPreviewUrl}
                        className="block h-[calc(100vh-141px)] min-h-[520px] w-full border-0 bg-transparent"
                      />
                    ) : (
                      <div className="flex h-[calc(100vh-141px)] min-h-[520px] items-center justify-center text-xs text-muted-foreground">
                        Preparing Lynx renderer…
                      </div>
                    )}
                  </section>
                </div>
                <details className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none font-medium text-foreground">
                    Component mapping
                  </summary>
                  <div className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {(["electron", "lynx"] as const).map((renderer) => {
                      const entry = selectedStory.renderers[renderer];
                      return (
                        <div key={renderer} className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em]">
                            {renderer}
                          </p>
                          <p className="mt-1 font-medium text-foreground">{entry.component}</p>
                          <p className="mt-1 break-words font-mono text-[10px] leading-4">
                            {entry.module}
                          </p>
                          <p className="mt-1">{entry.consumers.join(" · ")}</p>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </section>
            </article>
          ) : null}
        </main>
      </div>
    </div>
  );
}
