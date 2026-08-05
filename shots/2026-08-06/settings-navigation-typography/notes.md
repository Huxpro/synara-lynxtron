# Settings navigation typography evidence

Status: retained current-head Web authority and Lynx-for-Web geometry

## Residual

The fresh Settings matrix exposed a shared navigation-label mismatch:

- Web `App` label: 12px, weight 400, 18px line-height, 26px total height.
- Previous Lynx label: 11px, weight 500, 16px line-height, 24px total height.

The smaller, heavier Lynx label shifted each group's first row upward by 2px.
This was owned by `.SharedSettingsNavigationGroupLabel`, not by a route-local
margin.

## Current geometry

- Web `App`: x=6, y=134, 244x26; first row y=160.
- Lynx-for-Web `App`: x=6, y=98, 243x26; first row y=124.
- Web's 36px vertical offset is desktop chrome. After subtracting it, the group
  label and first row align exactly.
- Lynx resolved style: 12px, weight 400, 18px line-height, 4px vertical padding.
- Group labels now also match Web's muted-foreground/58 tone.
- The Back row applies Web's foreground/95 idle hierarchy to its icon and
  label together, restoring full tone on hover/press.

## Identity

- Lynx-for-Web bundle:
  `d5d68b1f04e87c03ab7c48701fe93dd5ed79d1bcd47bda2663ec8111e3df217f`
- Native/Desktop bundle:
  `0de6ee7f1828dde2e1e62d6666aca3dc14f259cd61d405470b83d07ccded0a3c`
- Static-tone follow-up bundles: Lynx-for-Web `3491630c…`; Native
  `701b6b49…`.
- Focused navigation/search/layout tests: 5/5.
- Web and Native/Desktop production builds passed with the existing CSS and
  optional `ws` native-module warnings only.
