import type {ReactNode} from 'react';

/** Hover/focus hint in a small charcoal bubble. */
export function Tooltip({
  content,
  placement = 'top',
  open = false,
  className = '',
  children,
}: {
  content: ReactNode;
  placement?: 'top' | 'bottom';
  open?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        'sbm-tip',
        placement === 'bottom' ? 'sbm-tip--bottom' : '',
        open ? 'sbm-tip--open' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
      <span role="tooltip" className="sbm-tip__bubble">
        {content}
      </span>
    </span>
  );
}
