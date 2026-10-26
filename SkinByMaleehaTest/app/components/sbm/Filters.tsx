import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import {Link} from 'react-router';
import {Icon} from './Icon';

/**
 * Outline pill chip — selectable filter (onClick), filter link (`to`, keeps the
 * selection in the URL) or removable token (onRemove).
 */
export function Tag({
  selected = false,
  onClick,
  onRemove,
  to,
  className = '',
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'onClick'> & {
  selected?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onRemove?: () => void;
  /** Internal route — renders a router <Link> (scroll position is kept). */
  to?: string;
  children?: ReactNode;
}) {
  const cls = ['sbm-tag', selected ? 'sbm-tag--selected' : '', className]
    .filter(Boolean)
    .join(' ');
  if (onRemove) {
    return (
      <span className={cls} {...rest}>
        {children}
        <button type="button" className="sbm-tag__remove" aria-label="Remove" onClick={onRemove}>
          <Icon name="x" size={14} />
        </button>
      </span>
    );
  }
  if (to) {
    return (
      <Link
        to={to}
        prefetch="intent"
        preventScrollReset
        className={cls}
        aria-current={selected ? 'true' : undefined}
        {...rest}
      >
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} aria-pressed={selected} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}

export type SelectOption = string | {value: string; label: string};

/** Native select in the pill field style: caps label, chevron, optional hint and error. */
export function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  id,
  disabled = false,
  className = '',
  style,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string | boolean;
  options?: readonly SelectOption[];
  placeholder?: string;
  style?: CSSProperties;
}) {
  const auto = useId();
  const fid = id || auto;
  const msg = typeof error === 'string' ? error : hint;
  return (
    <div
      className={[
        'sbm-field',
        error ? 'sbm-field--error' : '',
        disabled ? 'sbm-field--disabled' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {label ? (
        <label className="sbm-field__label" htmlFor={fid}>
          {label}
        </label>
      ) : null}
      <div className="sbm-field__control">
        <select
          id={fid}
          className="sbm-field__input sbm-field__select"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) =>
            typeof o === 'string' ? (
              <option key={o} value={o}>
                {o}
              </option>
            ) : (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ),
          )}
        </select>
        <span className="sbm-field__chev">
          <Icon name="chevron-down" size={18} />
        </span>
      </div>
      {msg ? <span className="sbm-field__hint">{msg}</span> : null}
    </div>
  );
}
