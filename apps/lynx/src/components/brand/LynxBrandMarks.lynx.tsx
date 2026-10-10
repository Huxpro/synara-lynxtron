// FILE: LynxBrandMarks.lynx.tsx
// Purpose: The Lynx logo and the Lynxtron mark side by side. The app's own identity is the
//   Synara mark (`SynaraLogo.lynx.tsx`); these two name the renderer and its shell, and only
//   appear on Lynx-only surfaces (the About dialog, the update page).

import lynxtronDarkMarkUrl from "../../../resources/lynxtron-mark-dark.png";
import lynxtronLightMarkUrl from "../../../resources/lynxtron-mark-light.png";

import { useTheme } from "../../adapters/useTheme.lynx";
import { cx } from "../ui/shared.lynx";
import "./lynx-brand-marks.css";

const LYNX_LOGO_PATHS = [
  "M10.7478 8.85145L5.42747 12.4521C4.84928 12.8434 4.44897 13.4315 4.30835 14.096L3.78819 16.5541C3.76061 16.6845 3.69946 16.8061 3.61028 16.9081L1.19608 20.0176C0.871038 20.3891 0.878876 21.3762 1.76916 22.0084C2.11056 22.3007 2.56701 22.9561 3.08619 23.7016C4.18546 25.2801 5.566 27.2625 6.73131 27.0566C8.3803 26.4874 10.3988 26.3053 11.9486 27.0566C16.7714 30.9317 13.1435 33.1123 11.9486 40C12.5875 36.317 15.9661 30.022 23.1082 26.6208C22.051 25.7723 19.302 25.1404 17.3931 24.9506C17.3931 24.9506 23.2579 20.0176 30.4913 17.7507C25.4417 5.94586 17.1065 0.304425 17.1065 0.304425C16.6818 -0.211712 15.8241 -0.0423878 15.6471 0.592541C15.5049 2.45876 15.2693 3.72778 14.8802 4.924L11.9486 1.60043C11.6424 1.23773 11.0302 1.44716 11.0333 1.91358C11.5296 4.62461 11.4599 6.14635 10.7478 8.85145ZM16.7775 2.51681C18.7865 5.92742 19.6965 7.86501 20.0052 11.481C17.8682 10.2883 16.9371 9.98479 15.3656 9.99234C16.2823 7.25343 16.5624 5.60419 16.7775 2.51681Z",
  "M29.677 27.4061C21.494 29.2458 16.4798 32.3991 12.301 39.9996C18.6825 29.4804 39.0001 31.3616 39.0001 31.3616C37.8944 29.491 34.8054 26.025 32.2723 24.357C32.2723 24.357 33.3344 22.3866 39.0001 20.7634C39.0001 20.7634 29.677 20.0193 24.2983 23.9865C26.2453 24.6936 28.4389 25.8913 29.677 27.4061Z",
] as const;

function lynxLogoContent(color: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">' +
    LYNX_LOGO_PATHS.map((path) => '<path d="' + path + '" fill="' + color + '" />').join("") +
    "</svg>"
  );
}

/**
 * Both marks in a row. `size` is the edge of each mark in px. The Lynxtron mark ships as two
 * bitmaps; `lynx-brand-marks.css` shows the one that matches the active theme.
 */
export function LynxBrandMarks(props: { readonly className?: string; readonly size?: number }) {
  const { svgColors } = useTheme();
  const edge = `${props.size ?? 40}px`;
  const markStyle = { width: edge, height: edge };
  return (
    <view className={cx("LynxBrandMarks", props.className)}>
      <view
        className="LynxBrandMarksMark"
        style={markStyle}
        accessibility-element
        accessibility-label="Lynx logo"
        accessibility-trait="image"
      >
        <svg
          className="LynxBrandMarksImage"
          content={lynxLogoContent(svgColors.foreground)}
          accessibility-element={false}
        />
      </view>
      <view
        className="LynxBrandMarksMark"
        style={markStyle}
        accessibility-element
        accessibility-label="Lynxtron logo"
        accessibility-trait="image"
      >
        <image
          className="LynxBrandMarksImage LynxBrandMarksLynxtron--on-light"
          src={lynxtronDarkMarkUrl}
          mode="aspectFit"
          accessibility-element={false}
        />
        <image
          className="LynxBrandMarksImage LynxBrandMarksLynxtron--on-dark"
          src={lynxtronLightMarkUrl}
          mode="aspectFit"
          accessibility-element={false}
        />
      </view>
    </view>
  );
}
