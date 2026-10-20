# ink-api-types

English | [한국어](README.ko.md)

TypeScript type declarations for the [Ink API](https://wicg.github.io/ink-enhancement/) (Delegated Ink Trail).

TypeScript's built-in DOM types (`lib.dom.d.ts`) only include features implemented by at least two browser engines. The Ink API is implemented only in Chromium-based browsers (Chrome 94+, Edge 93+), so `navigator.ink`, `Ink`, and `DelegatedInkTrailPresenter` are missing. This package adds them as globals.

## Installation

Install directly from the git repository.

```sh
pnpm add -D git+https://<repository URL>.git
# On GitHub: pnpm add -D github:<owner>/ink-api-types
```

## Setup

These are global declarations, so don't import them; just include them in the TypeScript compilation. Pick one of the following.

1. Add the package to `types` in `tsconfig.json`. If you already use `types`, list it together with the existing entries.

   ```json
   {
     "compilerOptions": {
       "types": ["vite/client", "ink-api-types"]
     }
   }
   ```

2. Add a reference at the top of a `.d.ts` file in your project (e.g. `vite-env.d.ts`).

   ```ts
   /// <reference types="ink-api-types" />
   ```

## Usage

```ts
const style: InkTrailStyle = { color: '#212529', diameter: 3 };

// null in unsupported browsers (Firefox, Safari) or when the request fails: draw with the canvas only.
const requestInkPresenter = async (area: Element) => {
  const ink = area.ownerDocument.defaultView?.navigator.ink;
  if (!ink) return null;
  try {
    return await ink.requestPresenter({ presentationArea: area });
  } catch {
    return null;
  }
};

const presenter = await requestInkPresenter(canvas);

canvas.addEventListener('pointermove', (event) => {
  const coalesced = event.getCoalescedEvents?.() ?? [];
  const samples = coalesced.length ? coalesced : [event];

  // 1) Draw first, in the same handler (use the same lineWidth and color as `style`).
  draw(samples);

  // 2) Pass the last event you drew as the trail's start point.
  presenter?.updateInkTrailStartPoint(samples.at(-1) ?? event, style);
});
```

## Notes

Based on the spec and the Chromium source as of October 2026.

- The trail does not leave strokes behind. It is shown only for the next animation frame and then removed, so the app must draw the strokes itself (on a canvas, etc.). There is no API to clear the trail either; when drawing stops, just stop calling it.
- `diameter` is in CSS px. The browser applies the zoom factor, so pass the same value and color as the canvas `lineWidth` and stroke color.
- The trail is drawn only when it matches a move input forwarded by the browser.
  - Pass a `pointermove` event or one of its `getCoalescedEvents()`.
  - Events that don't match are skipped silently: no exception, just no trail.
  - Synthetic events (`isTrusted` is false) throw `NotAllowedError`.
- `navigator.ink`, `presentationArea`, and the event must belong to the same document. When drawing on an element inside an iframe or popup, use `el.ownerDocument.defaultView.navigator.ink`.
- Depending on the implementation, a `requestPresenter()` failure may be thrown synchronously, so wrap it in `try { await … } catch`.
- Using it together with a `desynchronized: true` canvas is not recommended.
- Unlike the spec (non-nullable), `navigator.ink` is declared optional. It really is `undefined` in Firefox and Safari, so the intent is to make any use without feature detection fail at compile time.
- Once the Ink API lands in TypeScript's `lib.dom`, remove this package; the overlapping declarations may conflict.

## Browser support

| Browser              | Support            |
| -------------------- | ------------------ |
| Chrome 94+, Edge 93+ | Enabled by default |
| Firefox, Safari      | Not supported      |

On Windows 11 24H2 and later the OS compositor draws the trail; on other platforms the browser's (viz) Skia renderer does.

## Type tests

```sh
pnpm install
pnpm test   # compiles test/ink-api-tests.ts with tsc (type checking only)
```

Lines marked with `@ts-expect-error` pass only if they produce a type error. Verified with TypeScript 5.9.3 and 6.0.3. The `lib.dom.d.ts` of 7.0.2 is byte-identical to that of 6.0.3.

As of 2026-10-20, there are no Ink API declarations in the `lib.dom.d.ts` of TypeScript 5.9.3, 6.0.3, 7.0.2 (latest), 7.1.0-dev.20261019.1 (nightly), or the main branch of TypeScript-DOM-lib-generator.

## References

- Spec: https://wicg.github.io/ink-enhancement/
- Explainer: https://github.com/WICG/ink-enhancement
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Ink_API
