export interface Item {
  id: string;
  title: string;
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'done', title: 'Done' },
];

/** The logical drag `type` shared by every card. */
export const CARD_TYPE = 'card';

/**
 * Distinct seeds per pane so it's obvious which board a card came from after it
 * crosses a window boundary. Ids are namespaced by pane to stay globally unique.
 */
export function seedItems(pane: string): Item[] {
  const label = pane.toUpperCase();
  switch (pane) {
    case 'b':
      return [{ id: `${pane}-1`, title: `${label} · Review PR`, columnId: 'todo' }];
    case 'tab':
      return [
        { id: `${pane}-1`, title: `${label} · Write tests`, columnId: 'todo' },
        { id: `${pane}-2`, title: `${label} · Ship it`, columnId: 'done' },
      ];
    default: // 'a'
      return [
        { id: `${pane}-1`, title: `${label} · Design API`, columnId: 'todo' },
        { id: `${pane}-2`, title: `${label} · Wire channel`, columnId: 'todo' },
        { id: `${pane}-3`, title: `${label} · Native DnD`, columnId: 'todo' },
        { id: `${pane}-4`, title: `${label} · Demo shell`, columnId: 'done' },
      ];
  }
}
