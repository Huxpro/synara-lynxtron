# Dark Composer material calibration

Status: retained current-head dark Browser comparison and exact-owned Native
paint evidence.

## Residuals

The first dark current-head pair separated three Composer material differences
from the already registered large-area host-vibrancy delta:

1. Lynx Composer kept the light `0 4px 18px -6px` 7% ink shadow. Web dark uses
   `0 6px 24px -10px rgba(0,0,0,0.30)`.
2. The runtime permission trigger used 8px radius; Web resolves 10px.
3. The newly shared project folder path was embedded with full theme ink even
   though the trigger icon role is secondary foreground (Web 58%).

These are ordinary product-consumer mismatches, not Electron backdrop
material.

## Fix

- `.SliceRoot--theme-dark .ComposerInputSurfaceLynx` now owns the Web dark
  shadow recipe.
- `.ComposerRuntimeTriggerLynx` uses 10px radius in both themes.
- The shared `folder-2.svg` is colorized with `svgColors.mutedForeground`
  instead of full theme ink.

## Browser evidence

At `1280x820`, DPR 1, dark, comfortable:

- Composer Web/Lynx: `736x95`, `rgb(23,23,23)`, radius 19.2px.
- Final Lynx shadow resolves exactly to
  `rgba(0,0,0,0.3) 0 6px 24px -10px`.
- Runtime trigger Web/Lynx: `118.15625x28`, radius 10px.
- Folder Web/Lynx: 14x14; the Lynx SVG now embeds
  `rgba(252,252,252,0.6)` rather than `#fcfcfc`.
- Full-access shield and chevron retain canonical dark `#fe8549`.

The Lynx bundle reload also shows the real provider-status banner, shifting
absolute Composer Y by 39.25px. All material and trigger-relative comparisons
are unaffected.

## Native evidence

- Production bundle:
  `14df3c33d770366fc5b54e25da67639ebf6dcfcb44114fe026abc02a529c2116`.
- Snapshot online backup:
  `f7c20db83890598c21040e8732c19d7f4bc2ab1966a8990c350d3a36a2c21353`.
- Owned launch root/child: `43123 -> 43155`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Root is explicitly `SliceRoot--theme-dark`.
- Composer `400,461,736x95`, `rgb(23,23,23)`,
  `0 6px 24px -10px #0000004c`.
- Folder `415,568,14x14`; computed paint is approximately 58% and embedded SVG
  stroke is `rgba(252,252,252,0.6)`.
- Warning/error console: empty.

Current Lynx DevTool returns radius `0px` for this compound runtime trigger
view, so Native runtime radius is not claimed from that field. The 10px radius
is covered by the focused source contract and Lynx-for-Web resolved style.

Focused Composer tests pass 5/5. Lynx-for-Web and Native/Desktop production
builds pass with only existing warnings.
