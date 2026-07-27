# Cross-window Drag & Drop — POC

[![CI](https://github.com/oshri134/cross-window-dnd/actions/workflows/ci.yml/badge.svg)](https://github.com/oshri134/cross-window-dnd/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/cross-window-dnd.svg)](https://www.npmjs.com/package/cross-window-dnd)

**▶ Live demo: <https://cross-window-dnd.vercel.app>** — drag a card between the
two frames, or click *Open second tab* and drag across real browser tabs.

Proof that **native HTML5 Drag and Drop** — not pointer/mouse tracking — is the
right engine for dragging items **between separate windows, iframes, and browser
tabs**, with **`BroadcastChannel`** as a side-channel for state/UX sync.

A tiny React API (`useDraggable` / `useDroppable` / `useCrossWindowDrag`) plus a
working two-board demo. Not a production library — a POC that proves the model.

## Why native DnD (and not dnd-kit / react-beautiful-dnd)

Pointer-based DnD libraries track `mousemove`/`pointermove` inside **one
document**. The moment the cursor leaves that window they're blind — there is no
cross-window pointer stream. Native HTML5 DnD is driven by the **OS/compositor**:
the drag lives above every window, so `dragenter`/`dragover`/`drop` fire in a
*different* tab or iframe, and `dataTransfer` ferries the payload across the
boundary for you. That is the only web primitive that actually crosses windows.

## Two layers (kept separate on purpose)

1. **Drag transport** — `draggable`, `dragstart`/`dragover`/`drop`,
   `dataTransfer.setData/getData`. This is what physically moves the item across
   the window. It works even with the channel disabled.
2. **Coordination** — `BroadcastChannel` messages: *remote drag started* (idle
   windows highlight their drop zones), *item moved* (the source window removes
   the item), *drag ended* (clear highlights). This is pure UX/state sync; it is
   **never** the authoritative transport.

```
Window A (source)                         Window B (target)
  useDraggable                              useDroppable
    │ dragstart                               │
    ├─ dataTransfer.setData ──── OS drag ────▶ drop → getData → onDrop (add card)
    └─ channel.post(dragstart) ─┐         ┌── channel.post(item-moved)
                                ▼         ▼
                        BroadcastChannel "cross-window-dnd"
   remove source card ◀── item-moved ────┘   highlight zones ◀── dragstart
```

## Library API

```ts
const { attributes, listeners, isDragging } = useDraggable({ id, type, data });
// spread {...attributes} {...listeners} on the drag source.

const { listeners, isOver, isRemoteDragActive } = useDroppable({ id, accept, onDrop });
// spread {...listeners} on the drop zone. onDrop(payload) fires for accepted items.

const { activeDrag, remoteDragging } = useCrossWindowDrag();
// current *remote* drag session, for highlighting idle zones.
```

- **Payload in `dataTransfer`** — small JSON under MIME `application/x-cwdnd`:
  `{ id, type, sourceWindowId, data }`.
- **Window identity** — `crypto.randomUUID()` cached in `sessionStorage`, so each
  tab/iframe has a stable, unique id.
- **`accept` gating** — during `dragover` the browser hides the payload contents
  (security), exposing only `dataTransfer.types`. So we gate on the MIME type
  there and do the authoritative `type` check on `drop`, where data is readable.
- **Race guard** — the target window broadcasts `item-moved`; only the window
  whose id equals `sourceWindowId` removes the item. Same-window moves are handled
  locally (BroadcastChannel never echoes to its own sender), so nothing double-fires.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
```

The whole demo is one bundle; the "route" comes from the query string
(`?view=board&pane=a|b|tab`) so every frame/tab shares one **origin** — required
for `BroadcastChannel`.

## Tests

```bash
npm test         # vitest run (jsdom)
npm run test:watch
```

Native DnD is driven by the OS compositor and can't be scripted from a headless
runner, so the **interactions** are verified manually (see the checklist below).
What *is* unit-tested is the pure logic underneath, extracted to be DOM-free:

- `src/lib/protocol.ts` — `parsePayload` (validates the `dataTransfer` payload, so
  a stray drag from another app can't crash a drop handler) and `isAccepted`.
- `src/demo/boardState.ts` — `applyDrop` / `applyRemoteMove`: the local-move,
  remote-arrival, and source-removal state transitions, including the race guard.

CI (GitHub Actions) runs `npm test` and `npm run build:lib` on every push and PR;
tagged releases (`v*`) publish to npm with provenance.

## Verify checklist

- [ ] **Iframe → iframe:** drag a card from the left board into a column on the
      right board. It disappears from the left and appears on the right, no refresh.
- [ ] **Remote highlight:** as soon as you *start* dragging in one frame, the
      other frame's columns light up (dashed accent border) before the cursor
      arrives.
- [ ] **Two real tabs:** click **Open second tab**, then drag between the original
      window's frames and the new tab. Same channel, same behaviour.
- [ ] **Same-window move:** drag a card between Todo/Done in the *same* board — it
      just moves, no duplicate, no removal glitch.
- [ ] **Cancelled drag:** start a drag and drop outside any column — highlights
      clear and nothing moves.

## Known limitation — custom drag preview

Native DnD renders its own drag image via the **OS compositor**, so a JS-drawn
continuous overlay that follows the cursor across windows is **not possible**
(you can only swap the static image at `dragstart` via `setDragImage`, and even
that doesn't cross the window boundary). This is the price of being the only
primitive that actually crosses windows. If you need a pixel-perfect custom
preview, you're back to single-window pointer tracking.

## Out of scope (POC)

Cross-origin `postMessage` bridges · SharedWorker central store · FLIP animations
· pointer-based list sorting · npm packaging.
