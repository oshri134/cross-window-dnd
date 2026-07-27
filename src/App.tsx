import { Board } from './demo/Board';

/** Reads the "route" from the query string. Returns the pane id when this window
 *  should render a bare board (inside an iframe or a popup tab), else null. */
function usePane(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'board') return params.get('pane') ?? 'a';
  return null;
}

function boardUrl(pane: string): string {
  return `${window.location.pathname}?view=board&pane=${pane}`;
}

function Shell() {
  const openSecondTab = () => {
    window.open(boardUrl('tab'), '_blank', 'noopener');
  };

  return (
    <div className="shell">
      <header className="shell__header">
        <h1>Cross-window Drag &amp; Drop</h1>
        <p>
          Native HTML5 drag-and-drop carries the item across the window boundary;
          a <code>BroadcastChannel</code> keeps both boards in sync. Drag a card
          from the left board into the right one — it leaves the source and lands
          in the target, no refresh.
        </p>
        <button className="btn" onClick={openSecondTab}>
          Open second tab ↗
        </button>
        <span className="shell__hint">
          (or drag between the two frames below — same channel, same origin)
        </span>
      </header>

      <div className="shell__panes">
        <iframe className="pane" title="Board A" src={boardUrl('a')} />
        <iframe className="pane" title="Board B" src={boardUrl('b')} />
      </div>

      <footer className="shell__footer">
        Idle drop zones light up the moment a drag starts elsewhere. Note: the OS
        renders the drag preview across windows — a custom continuous overlay
        isn&apos;t possible with native DnD (see README).
      </footer>
    </div>
  );
}

export default function App() {
  const pane = usePane();
  return pane !== null ? <Board pane={pane} /> : <Shell />;
}
