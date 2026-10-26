import {useId, useState, type CSSProperties, type ReactNode} from 'react';
import {Icon} from './Icon';

export type AccordionItem = {title: ReactNode; content: ReactNode};

/** Stacked disclosure rows between 1px charcoal rules — INGREDIENTS / DIRECTIONS TO USE. */
export function Accordion({
  items,
  defaultOpen = [],
  multiple = true,
  className = '',
  style,
}: {
  items: AccordionItem[];
  defaultOpen?: number[];
  multiple?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [open, setOpen] = useState<number[]>(defaultOpen);
  const uid = useId();
  const toggle = (i: number) =>
    setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : multiple ? o.concat(i) : [i]));
  return (
    <div className={['sbm-acc', className].filter(Boolean).join(' ')} style={style}>
      {items.map((it, i) => {
        const isOpen = open.includes(i);
        const panelId = `${uid}-panel-${i}`;
        return (
          // eslint-disable-next-line react/no-array-index-key -- items are a fixed list; open state is index-based
          <div key={i} className="sbm-acc__item">
            <button
              type="button"
              className="sbm-acc__trigger"
              aria-expanded={isOpen}
              aria-controls={isOpen ? panelId : undefined}
              onClick={() => toggle(i)}
            >
              <span>{it.title}</span>
              <Icon name={isOpen ? 'minus' : 'plus'} size={18} />
            </button>
            {isOpen ? (
              <div id={panelId} className="sbm-acc__panel">
                {it.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
