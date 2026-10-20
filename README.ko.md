# ink-api-types

[English](README.md) | 한국어

[Ink API](https://wicg.github.io/ink-enhancement/)(Delegated Ink Trail)의 TypeScript 타입 선언입니다.

TypeScript 기본 DOM 타입(`lib.dom.d.ts`)은 브라우저 엔진 2곳 이상이 구현한 기능만 담습니다. Ink API는 Chromium 계열(Chrome 94+, Edge 93+)만 구현해서 `navigator.ink`, `Ink`, `DelegatedInkTrailPresenter` 타입이 없습니다. 이 패키지가 그 타입을 전역으로 추가합니다.

## 설치

git 저장소에서 바로 설치합니다.

```sh
pnpm add -D git+https://<저장소 URL>.git
# GitHub 이면: pnpm add -D github:<owner>/ink-api-types
```

## 설정

전역 선언이라 import 하지 않고 TypeScript 컴파일 대상에 포함만 시킵니다. 둘 중 하나를 고르세요.

1. `tsconfig.json` 의 `types` 에 추가합니다. `types` 를 이미 쓰고 있으면 기존 항목과 같이 적어야 합니다.

   ```json
   {
     "compilerOptions": {
       "types": ["vite/client", "ink-api-types"]
     }
   }
   ```

2. 프로젝트의 `.d.ts` 파일(예: `vite-env.d.ts`) 맨 위에 참조를 추가합니다.

   ```ts
   /// <reference types="ink-api-types" />
   ```

## 사용 예

```ts
const style: InkTrailStyle = { color: '#212529', diameter: 3 };

// 미지원 브라우저(Firefox·Safari)거나 요청이 실패하면 null — canvas 만으로 그린다.
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

  // 1) 같은 핸들러에서 먼저 그린다(캔버스 lineWidth·색은 style 과 같게).
  draw(samples);

  // 2) 마지막으로 그린 이벤트를 궤적 시작점으로 넘긴다.
  presenter?.updateInkTrailStartPoint(samples.at(-1) ?? event, style);
});
```

## 알아둘 점

스펙과 Chromium 소스를 기준으로 2026-10에 정리했습니다.

- 궤적은 획을 남기지 않습니다. 다음 애니메이션 프레임 동안만 보이고 사라지므로, 획은 앱이 canvas 등에 직접 그려야 합니다. 궤적을 지우는 API도 없어서, 그리기를 멈출 땐 호출만 멈추면 됩니다.
- `diameter` 는 CSS px 입니다. 줌 배율은 브라우저가 반영하니 캔버스 `lineWidth` 와 같은 값, 같은 색을 넘기세요.
- 궤적은 브라우저가 전달한 move 입력과 맞물려야 그려집니다.
  - `pointermove` 나 그 `getCoalescedEvents()` 요소를 넘기세요.
  - 맞물리지 않는 이벤트는 예외 없이 궤적만 생략됩니다.
  - 합성(`isTrusted` 가 false) 이벤트는 `NotAllowedError` 입니다.
- `navigator.ink`, `presentationArea`, 이벤트는 같은 document 에 있어야 합니다. iframe·팝업의 요소에 그릴 땐 `el.ownerDocument.defaultView.navigator.ink` 를 쓰세요.
- `requestPresenter()` 실패는 구현에 따라 동기 throw 로 올 수 있어 `try { await … } catch` 로 감싸세요.
- `desynchronized: true` 캔버스와 함께 쓰는 것은 권장되지 않습니다.
- `navigator.ink` 는 스펙(non-nullable)과 달리 optional 로 선언했습니다. Firefox·Safari 에선 실제로 `undefined` 라서, 기능 감지 없이 쓰면 컴파일 단계에서 막히게 하려는 의도입니다.
- TypeScript `lib.dom` 에 Ink API 가 들어오면 이 패키지는 지우세요. 선언이 겹치면 충돌할 수 있습니다.

## 지원 현황

| 브라우저              | 지원        |
| --------------------- | ----------- |
| Chrome 94+, Edge 93+  | 기본 활성화 |
| Firefox, Safari       | 미지원      |

Windows 11 24H2 이상은 OS 합성기가, 그 밖의 플랫폼은 브라우저(viz)의 Skia 렌더러가 궤적을 그립니다.

## 타입 테스트

```sh
pnpm install
pnpm test   # tsc 로 test/ink-api-tests.ts 를 컴파일만 확인
```

`@ts-expect-error` 가 붙은 줄은 타입 에러가 나야 통과합니다. TypeScript 5.9.3, 6.0.3 에서 확인했습니다. 7.0.2 의 `lib.dom.d.ts` 는 6.0.3 과 바이트 단위로 같습니다.

2026-10-20 기준으로 TypeScript 5.9.3, 6.0.3, 7.0.2(latest), 7.1.0-dev.20261019.1(nightly)과 TypeScript-DOM-lib-generator main 의 `lib.dom.d.ts` 에는 Ink API 선언이 없습니다.

## 참고

- 스펙: https://wicg.github.io/ink-enhancement/
- Explainer: https://github.com/WICG/ink-enhancement
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Ink_API
