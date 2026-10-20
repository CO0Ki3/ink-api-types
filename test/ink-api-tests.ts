// Type tests: only checks that this file compiles with tsc (it is never executed).
// Lines marked with `@ts-expect-error` pass only if they produce a type error.

declare const canvas: HTMLCanvasElement;
declare const pointerEvent: PointerEvent;
declare const mouseEvent: MouseEvent;
declare const unknownValue: unknown;

const style: InkTrailStyle = { color: '#212529', diameter: 3 };

// Optional, to account for browsers without support.
const maybeInk: Ink | undefined = navigator.ink;
// @ts-expect-error cannot be used without feature detection.
navigator.ink.requestPresenter();
// @ts-expect-error read-only.
navigator.ink = undefined;

async function usePresenter(ink: Ink) {
  const presenter: DelegatedInkTrailPresenter = await ink.requestPresenter({
    presentationArea: canvas,
  });
  await ink.requestPresenter();
  await ink.requestPresenter({});
  await ink.requestPresenter({ presentationArea: null });
  // @ts-expect-error presentationArea must be an Element.
  await ink.requestPresenter({ presentationArea: '#canvas' });
  // @ts-expect-error removed legacy signature.
  await ink.requestPresenter('delegated-ink-trail', canvas);

  const area: Element | null = presenter.presentationArea;
  // @ts-expect-error presentationArea is read-only.
  presenter.presentationArea = canvas;

  const result: void = presenter.updateInkTrailStartPoint(pointerEvent, style);
  presenter.updateInkTrailStartPoint(pointerEvent.getCoalescedEvents()[0], {
    color: 'rgb(0 0 0 / 50%)',
    diameter: 1.5,
  });
  // @ts-expect-error only accepts a PointerEvent.
  presenter.updateInkTrailStartPoint(mouseEvent, style);
  // @ts-expect-error color is required.
  presenter.updateInkTrailStartPoint(pointerEvent, { diameter: 3 });
  // @ts-expect-error diameter is required.
  presenter.updateInkTrailStartPoint(pointerEvent, { color: 'red' });
  // @ts-expect-error diameter must be a number.
  const wrongDiameter: InkTrailStyle = { color: 'red', diameter: '3px' };
  // @ts-expect-error removed legacy API.
  presenter.setLastRenderedPoint(pointerEvent, style);

  return { maybeInk, area, result, wrongDiameter };
}

// The global interface objects support instanceof checks.
if (unknownValue instanceof DelegatedInkTrailPresenter) {
  unknownValue.updateInkTrailStartPoint(pointerEvent, style);
}
if (unknownValue instanceof Ink) {
  void unknownValue.requestPresenter();
}

// Typical flow: feature-detect first, then use.
async function requestInkPresenter(area: Element) {
  const ink = area.ownerDocument.defaultView?.navigator.ink;
  if (!ink) return null;
  try {
    return await ink.requestPresenter({ presentationArea: area });
  } catch {
    return null;
  }
}

export { requestInkPresenter, usePresenter };
