# Settings Models provider radius

Status: retained Lynx-for-Web evidence for the Custom Models provider control.

## Residual

The provider select already matched Web at `144x28`, but inherited the generic
10px Lynx button radius. Web resolves this compact select to 8px. The adjacent
model input and Add button correctly use 10px and were not changed.

## Fix

`.SettingsCustomModelsProviderTrigger` now owns `border-radius: 8px`.

## Evidence

At `1280x820`, comfortable density:

- provider: `469,372,144x28`, radius `8px`, exact with Web;
- input: `621,372,369x28`, radius remains `10px`;
- Add: `998,370,69x32`, radius remains `10px`;
- connection diagnostics: empty.

The retained screenshot is `lynx-web.png`.

## Verification

- Focused Custom Models Rstest: 1 file, 2 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build and Sharp staging passed.
- Uncached changed-lines React Doctor against `71fcad16` reported zero
  diagnostics.
