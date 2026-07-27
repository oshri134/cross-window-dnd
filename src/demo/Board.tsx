import { useEffect, useState } from 'react';
import { getChannel, useDroppable, type DragPayload } from '../lib';
import { Card } from './Card';
import { applyDrop, applyRemoteMove } from './boardState';
import { CARD_TYPE, COLUMNS, seedItems, type Column as ColumnDef, type Item } from './seed';

/** One droppable column. Highlights on local hover OR remote drag of an accepted item. */
function Column({
  column,
  items,
  onDropItem,
}: {
  column: ColumnDef;
  items: Item[];
  onDropItem: (columnId: string, payload: DragPayload) => void;
}) {
  const { listeners, isOver, isRemoteDragActive } = useDroppable({
    id: column.id,
    accept: CARD_TYPE,
    onDrop: (payload) => onDropItem(column.id, payload),
  });

  const columnItems = items.filter((it) => it.columnId === column.id);
  const className = [
    'column',
    isRemoteDragActive ? 'column--remote' : '',
    isOver ? 'column--over' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} {...listeners}>
      <header className="column__header">
        <span>{column.title}</span>
        <span className="column__count">{columnItems.length}</span>
      </header>
      <div className="column__body">
        {columnItems.map((it) => (
          <Card key={it.id} item={it} />
        ))}
        {columnItems.length === 0 && <p className="column__empty">Drop here</p>}
      </div>
    </div>
  );
}

export function Board({ pane }: { pane: string }) {
  const channel = getChannel();
  const [items, setItems] = useState<Item[]>(() => seedItems(pane));

  // Source-removal path: when *our* item is dropped into another window, that
  // window broadcasts item-moved with our windowId as source — remove it here.
  useEffect(() => {
    return channel.subscribe((msg) => {
      if (msg.kind === 'item-moved') {
        setItems((prev) => applyRemoteMove(prev, msg, channel.windowId));
      }
    });
  }, [channel]);

  const handleDropItem = (columnId: string, payload: DragPayload) => {
    setItems((prev) => applyDrop(prev, payload, columnId));
  };

  const shortId = channel.windowId.slice(0, 4);

  return (
    <div className="board">
      <div className="board__title">
        <strong>Pane {pane.toUpperCase()}</strong>
        <span className="board__id">window {shortId}</span>
      </div>
      <div className="board__columns">
        {COLUMNS.map((col) => (
          <Column key={col.id} column={col} items={items} onDropItem={handleDropItem} />
        ))}
      </div>
    </div>
  );
}
