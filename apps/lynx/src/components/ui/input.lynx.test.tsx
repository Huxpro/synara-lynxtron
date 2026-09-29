import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Input accessibility contract", () => {
  it("never makes a controlled field readonly while it takes text", () => {
    // Lynxtron aborts (SIGABRT) when a single-line field turns readonly mid-input;
    // echoes are resolved by resolveControlledInputValue instead.
    const source = readFileSync(new URL("./input.lynx.tsx", import.meta.url), "utf8");
    expect(source).not.toContain('setAttribute("readonly"');
    expect(source).not.toContain("setNativePropsByRef(inputRef, { readonly: false })");
    expect(source).toContain("resolveControlledInputValue(pendingEchoes.current, next)");
  });

  it("uses the shared dark control surface while preserving soft fill ownership", () => {
    const source = readFileSync(new URL("./input.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("const { svgColors } = useTheme();");
    expect(source).toContain('!unstyled && variant === "default"');
    expect(source).toContain("{ backgroundColor: svgColors.formControlSurface }");
  });

  it("routes every placeholder through the Native input that paints its tone", () => {
    const source = readFileSync(new URL("./input.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain('"placeholder-color": props.placeholderColor');
    expect(source).toContain("placeholderColor={svgColors.placeholderForeground}");
    // lynx-ui's Input forwards only its own props, so it could not paint the tone.
    expect(source).toContain(
      "nativeInput || onKeyDown || autoFocus || props.placeholder !== undefined",
    );
  });

  it("centers the one-line textarea through shared size metrics", () => {
    const styles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.LxInputControl\s*\{[^}]*padding-left:\s*12px;[^}]*padding-right:\s*12px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--sm\s*\{[^}]*padding-left:\s*10px;[^}]*padding-right:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--lg\s*\{[^}]*padding-left:\s*14px;[^}]*padding-right:\s*14px;/s,
    );
    expect(styles).toMatch(
      /\.LxInput\s*\{[^}]*box-sizing:\s*border-box;[^}]*padding-top:\s*6px;[^}]*padding-bottom:\s*6px;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--sm > \.LxInput\s*\{[^}]*padding-top:\s*4px;[^}]*padding-bottom:\s*4px;[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--lg > \.LxInput\s*\{[^}]*padding-top:\s*8px;[^}]*padding-bottom:\s*8px;/s,
    );
  });

  it("matches the Electron textarea size axis", () => {
    const source = readFileSync(new URL("./input.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");

    expect(source).toContain('multiline && "LxInputControl--multiline"');
    expect(styles).toMatch(
      /\.LxInputControl--multiline\s*\{[^}]*min-height:\s*70px;[^}]*padding-left:\s*11px;[^}]*padding-right:\s*11px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--multiline > \.LxInput\s*\{[^}]*padding-top:\s*5px;[^}]*padding-bottom:\s*5px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--multiline\.LxInputControl--sm\s*\{[^}]*min-height:\s*66px;[^}]*padding-left:\s*9px;[^}]*padding-right:\s*9px;/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--multiline\.LxInputControl--lg\s*\{[^}]*min-height:\s*74px;[^}]*padding-left:\s*11px;[^}]*padding-right:\s*11px;/s,
    );
  });

  it("forwards normalized labels through the keyboard-input branch", () => {
    const source = readFileSync(new URL("./input.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain("accessibleLabel={accessibilityLabel ?? ariaLabel}");
    expect(source).toContain('"aria-label": props.accessibleLabel');
    expect(source).toContain('"accessibility-element": props.accessibleLabel ? true : undefined');
    expect(source).toContain('"accessibility-label": props.accessibleLabel');
    expect(source).toContain("ariaInvalid={ariaInvalid}");
    expect(source).toContain('"aria-invalid": props.ariaInvalid');
    expect(source).toContain('"default-value": props.defaultValue');
    expect(source).toContain("value: props.value ?? props.defaultValue");
    expect(source).toContain('void setValue(props.defaultValue ?? "").catch(() => undefined)');
    expect(source).toContain(
      "{nativeInput || onKeyDown || autoFocus || props.placeholder !== undefined ? (",
    );
    expect(source).toContain("<textarea {...sharedProps} maxlines={props.maxLines ?? 1} />");
    expect(source).toContain("maxLines={multiline ? (maxLines ?? 5) : 1}");
    expect(source).toContain('props.type === "number" ? "[0-9.]*" : undefined');
    expect(source).toContain(
      '"accessibility-state": props.disabled ? { disabled: true } : undefined',
    );
  });

  it("projects real input focus onto the shared control shell", () => {
    const source = readFileSync(new URL("./input.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");

    expect(source).toContain("const [focused, setFocused] = useState(false);");
    expect(source).toContain("setFocused(true);");
    expect(source).toContain("setFocused(false);");
    expect(source).toContain('focused && "ui-focus"');
    expect(styles).toMatch(
      /\.LxInputControl\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl\.ui-focus\s*\{[^}]*border-top-color:\s*var\(--control-input-focus-border\);[^}]*border-right-color:\s*var\(--control-input-focus-border\);[^}]*border-bottom-color:\s*var\(--control-input-focus-border\);[^}]*border-left-color:\s*var\(--control-input-focus-border\);/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--invalid\s*\{[^}]*border-top-color:\s*var\(--input-invalid-border\);[^}]*border-left-color:\s*var\(--input-invalid-border\);/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--invalid\.ui-focus\s*\{[^}]*border-top-color:\s*var\(--input-invalid-focus-border\);[^}]*border-left-color:\s*var\(--input-invalid-focus-border\);/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--multiline\.LxInputControl--invalid\s*\{[^}]*border-top-color:\s*var\(--textarea-invalid-border\);/s,
    );
    expect(styles).toMatch(
      /\.LxInputControl--multiline\.LxInputControl--invalid\.ui-focus\s*\{[^}]*border-top-color:\s*var\(--textarea-invalid-focus-border\);/s,
    );
  });
});
