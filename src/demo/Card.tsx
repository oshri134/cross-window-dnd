import { useDraggable } from '../lib';
import { CARD_TYPE, type Item } from './seed';

/** Payload data carried in `dataTransfer` so a receiving window can re-create the card. */
export interface CardData {
  title: string;
  fromColumnId: string;
}

export function Card({ item }: { item: Item }) {
  const { attributes, listeners, isDragging } = useDraggable<CardData>({
    id: item.id,
    type: CARD_TYPE,
    data: { title: item.title, fromColumnId: item.columnId },
  });

  return (
    <div
      className="card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      {item.title}
    </div>
  );
}
