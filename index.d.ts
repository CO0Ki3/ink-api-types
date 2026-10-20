// Type declarations for the Ink API (Delegated Ink Trail)
// Spec: https://wicg.github.io/ink-enhancement/ (WICG CG Draft, as of 2026-10)
//
// TypeScript's lib.dom only includes features implemented by at least two browser
// engines, and the Ink API is implemented only in Chromium-based browsers
// (Chrome 94+, Edge 93+), so it is missing there. These are global declarations:
// include them via tsconfig `types` or `/// <reference types="ink-api-types" />`
// instead of importing them.

/**
 * Argument of `Ink.requestPresenter()`.
 * @see https://wicg.github.io/ink-enhancement/#dom-inkpresenterparam
 */
interface InkPresenterParam {
  /**
   * The area the trail is drawn in. The trail is clipped to this element's border box
   * (in client coordinates), recomputed from the current layout on every
   * `updateInkTrailStartPoint()` call. When omitted or `null`, the whole viewport is used.
   * Must be an element in the same document as `navigator.ink`.
   * @default null
   */
  presentationArea?: Element | null;
}

/**
 * Trail style. Pass the same color and width as the strokes the app draws itself so the
 * trail joins them seamlessly.
 * @see https://wicg.github.io/ink-enhancement/#dom-inktrailstyle
 */
interface InkTrailStyle {
  /** A CSS color string. Throws a `TypeError` if it cannot be parsed. */
  color: string;
  /** Trail diameter in CSS px (the browser applies zoom). Throws if 0 or less, or NaN (Chromium: `NotSupportedError`). */
  diameter: number;
}

/**
 * A presenter that lets the browser draw the segment from the app's last rendered point to
 * the current pointer position ahead of the next frame, reducing perceived input latency.
 * The trail is shown only for the next animation frame and then removed, so the app must
 * draw the strokes itself to keep them (there is no API to clear the trail).
 * @see https://wicg.github.io/ink-enhancement/#delegatedinktrailpresenter
 */
interface DelegatedInkTrailPresenter {
  /** The area passed to `requestPresenter()`. Cannot be changed after creation. */
  readonly presentationArea: Element | null;
  /**
   * Updates the trail's start point with the last point the app just rendered and its style.
   *
   * - In the same `pointermove` handler, draw first (including coalesced events), then pass
   *   the last event you drew.
   * - The trail is drawn only when the event matches a move input forwarded by the browser,
   *   so pass a `pointermove` event or one of its `getCoalescedEvents()`. Events that don't
   *   match are skipped silently: no exception, just no trail.
   * - Exceptions (Chromium): untrusted event (`isTrusted` is false) `NotAllowedError`,
   *   diameter 0 or less / NaN `NotSupportedError`, unparsable color `TypeError`,
   *   detached document `InvalidStateError`.
   */
  updateInkTrailStartPoint(event: PointerEvent, style: InkTrailStyle): void;
}

/** Cannot be constructed directly (Illegal constructor). Declared only for `instanceof` checks, following lib.dom conventions. */
declare var DelegatedInkTrailPresenter: {
  prototype: DelegatedInkTrailPresenter;
  new (): DelegatedInkTrailPresenter;
};

/**
 * Entry point of the Ink API.
 * @see https://wicg.github.io/ink-enhancement/#ink-interface
 */
interface Ink {
  /**
   * Requests a presenter. Returns a new instance on every call.
   * Fails if `presentationArea` is an element of another document or the window is detached;
   * depending on the implementation the failure may be thrown synchronously, so wrap the
   * call in `try { await ... } catch`.
   */
  requestPresenter(
    param?: InkPresenterParam,
  ): Promise<DelegatedInkTrailPresenter>;
}

/** Cannot be constructed directly (Illegal constructor). Declared only for `instanceof` checks, following lib.dom conventions. */
declare var Ink: {
  prototype: Ink;
  new (): Ink;
};

interface Navigator {
  /**
   * Entry point of the Ink API. The spec declares it non-nullable, but it does not exist
   * (`undefined`) in Firefox and Safari, so it is declared optional to force feature detection.
   * When drawing on an element inside an iframe or popup, use the navigator of the window
   * that element belongs to (`el.ownerDocument.defaultView.navigator.ink`).
   * @see https://wicg.github.io/ink-enhancement/#dom-navigator-ink
   */
  readonly ink?: Ink;
}
