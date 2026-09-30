// FILE: PickerPanelShell.tsx
// Purpose: Share the visual shell used by combobox-style pickers in chat surfaces.
// Layer: Chat picker UI
// Depends on: shared input styling plus caller-provided content slots.

import { useEffect, useRef, type ReactNode } from "react";
import { SearchIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { Input } from "../ui/input";
import {
  COMPOSER_PICKER_MODEL_LIST_SCROLL_CLASS_NAME,
  COMPOSER_PICKER_RADIUS_CLASS_NAME,
  COMPOSER_PICKER_SEARCH_HEADER_CLASS_NAME,
  COMPOSER_PICKER_SEARCH_INPUT_CLASS_NAME,
} from "./composerPickerStyles";
import {
  PICKER_PANEL_PLAIN_BODY_CLASS_NAME,
  PICKER_PANEL_PLAIN_SEARCH_HEADER_CLASS_NAME,
  PICKER_PANEL_PLAIN_SEARCH_ICON_CLASS_NAME,
  PICKER_PANEL_PLAIN_SEARCH_INPUT_CLASS_NAME,
} from "./pickerPanelStyles";

/** Keys a search field inside a menu must let through so list navigation keeps working. */
export const MENU_NAVIGATION_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageDown",
  "PageUp",
  "Enter",
  "Escape",
]);

export function PickerPanelShell(props: {
  searchPlaceholder?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  searchInput?: ReactNode;
  stopSearchKeyPropagation?: boolean;
  autoFocusSearch?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  bleedParentPadding?: boolean;
  listMaxHeightClassName?: string;
  /**
   * `"plain"` is the dense picker panel: the search area drops all field chrome (no border,
   * fill, ring, or shadow) down to a magnifier + placeholder over a single hairline divider,
   * and the body loses its extra padding so the list chrome owns the 4px gutter on its own.
   * `"default"` keeps the bordered search field used by the composer submenus.
   */
  variant?: "default" | "plain";
}) {
  const {
    searchPlaceholder: searchPlaceholderProp,
    query: queryProp,
    onQueryChange,
    searchInput,
    stopSearchKeyPropagation: stopSearchKeyPropagationProp,
    autoFocusSearch: autoFocusSearchProp,
    children,
    footer,
    widthClassName: widthClassNameProp,
    bleedParentPadding: bleedParentPaddingProp,
    listMaxHeightClassName,
    variant: variantProp,
  } = props;
  const searchPlaceholder = searchPlaceholderProp ?? "Search";
  const query = queryProp ?? "";
  const stopSearchKeyPropagation = stopSearchKeyPropagationProp ?? false;
  const autoFocusSearch = autoFocusSearchProp ?? false;
  const widthClassName = widthClassNameProp ?? "w-72";
  const bleedParentPadding = bleedParentPaddingProp ?? false;
  const isPlain = (variantProp ?? "default") === "plain";
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        widthClassName,
        listMaxHeightClassName,
        bleedParentPadding ? cn("-m-1 overflow-clip", COMPOSER_PICKER_RADIUS_CLASS_NAME) : null,
      )}
    >
      {onQueryChange || searchInput ? (
        <PickerPanelSearchHeader
          autoFocus={autoFocusSearch}
          bleedParentPadding={bleedParentPadding}
          placeholder={searchPlaceholder}
          query={query}
          searchInput={searchInput}
          stopKeyPropagation={stopSearchKeyPropagation}
          variant={isPlain ? "plain" : "default"}
          {...(onQueryChange ? { onQueryChange } : {})}
        />
      ) : null}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          isPlain ? PICKER_PANEL_PLAIN_BODY_CLASS_NAME : "py-0.5",
          bleedParentPadding ? COMPOSER_PICKER_MODEL_LIST_SCROLL_CLASS_NAME : null,
        )}
      >
        {children}
      </div>
      {footer ? <div className="border-t p-1">{footer}</div> : null}
    </div>
  );
}

/** The search row of a picker panel; exported so the Components Lab can render it alone. */
export function PickerPanelSearchHeader(props: {
  autoFocus?: boolean;
  bleedParentPadding?: boolean;
  disabled?: boolean;
  placeholder?: string;
  query: string;
  searchInput?: ReactNode;
  stopKeyPropagation?: boolean;
  variant?: "default" | "plain";
  onQueryChange?: (query: string) => void;
}) {
  const isPlain = props.variant === "plain";
  const canEdit = props.onQueryChange !== undefined;
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!props.autoFocus || props.disabled || !canEdit) return;
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [props.autoFocus, props.disabled, canEdit]);

  return (
    <div
      className={cn(
        isPlain
          ? PICKER_PANEL_PLAIN_SEARCH_HEADER_CLASS_NAME
          : props.bleedParentPadding
            ? cn(COMPOSER_PICKER_SEARCH_HEADER_CLASS_NAME, "-top-1 pt-2")
            : "sticky top-0 z-20 shrink-0 border-b border-border bg-[var(--composer-surface)] p-1",
      )}
    >
      {isPlain ? (
        <SearchIcon aria-hidden="true" className={PICKER_PANEL_PLAIN_SEARCH_ICON_CLASS_NAME} />
      ) : null}
      {props.searchInput ?? (
        <Input
          className={
            isPlain
              ? PICKER_PANEL_PLAIN_SEARCH_INPUT_CLASS_NAME
              : cn(
                  "rounded-md border-border/60 shadow-none before:hidden has-focus-visible:border-neutral-500/15 has-focus-visible:ring-0 [&_input]:font-sans",
                  props.bleedParentPadding
                    ? COMPOSER_PICKER_SEARCH_INPUT_CLASS_NAME
                    : "bg-background",
                )
          }
          disabled={props.disabled}
          nativeInput
          ref={searchInputRef}
          size="sm"
          type="search"
          unstyled={isPlain}
          placeholder={props.placeholder ?? "Search"}
          value={props.query}
          onChange={(event) => props.onQueryChange?.(event.target.value)}
          onKeyDownCapture={
            props.stopKeyPropagation
              ? (event) => {
                  if (!MENU_NAVIGATION_KEYS.has(event.key)) event.stopPropagation();
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
