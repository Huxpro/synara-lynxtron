# Composer picker trigger chrome current-head fidelity

Status: retained Web, Lynx-for-Web, and exact-owned Native evidence

- Source base: `ee12bffb`.
- Current Web Model and Traits triggers use radius 10, transparent 1px borders,
  real 12x12 chevrons at opacity 0.6, and an 8px inter-trigger gap.
- The previous Lynx triggers used radius 8 without borders, 6px text chevrons,
  and a 6px inter-trigger gap. Model measured 91.1875px wide and Traits
  69.78125px wide.
- Lynx now uses generated 12x12 ChevronDown icons. Model owns 6px horizontal
  padding and 6px inner gaps; Traits owns 10px horizontal padding and an 8px
  label/chevron gap. Both own transparent borders and radius 10.
- Current Web and Lynx-for-Web are exact: Model
  `x=868.09375 width=95.15625`, Traits `x=971.25 width=83.75`, both 28px high,
  with an 8px inter-trigger gap. Both PNGs are `1280x820`; browser errors empty.
- A real Model open recheck proves enabled provider chevrons remain 12px and
  trailing-aligned while disabled provider chevrons remain hidden.
- Focused picker contract: 1 file, 3/3 tests.
- Configured Lynx-for-Web and Native/Desktop production builds: pass.
- Exact-owned Native bundle
  `35c2fc2cb8135bc932cbf937f14a0c9a63affca918be9bcdc3a5894dcead725f`
  retained Model/Traits and both chevrons. Native rounded geometry is 96x28 and
  84x28 with 12x12 chevrons, a `2560x1576` frame, and empty warning/error
  console.
- Compound Native VIEW radius/border remains under the known DevTool zero-value
  boundary; numeric chrome closure is claimed from source/test plus current
  Lynx-for-Web.
