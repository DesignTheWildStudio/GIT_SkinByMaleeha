import type {CSSProperties, InputHTMLAttributes, ReactNode} from 'react';
import {Icon} from './Icon';

/** Square checkbox — echoes the boxed checklist on the packaging dieline. */
export function Checkbox({
  label,
  description,
  disabled = false,
  className = '',
  style,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
  description?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <label
      className={['sbm-choice', disabled ? 'sbm-choice--disabled' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <input type="checkbox" disabled={disabled} {...rest} />
      <span className="sbm-choice__box">
        <Icon name="check" size={14} strokeWidth={2.25} />
      </span>
      {label || description ? (
        <span className="sbm-choice__text">
          {label ? <span>{label}</span> : null}
          {description ? <span className="sbm-choice__desc">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

/** Inline form feedback: brick tint for errors, aloe for confirmations. */
export function FormMessage({
  tone = 'error',
  children,
  className = '',
}: {
  tone?: 'error' | 'success';
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={['sf-formmsg', 'sf-formmsg--' + tone, className].filter(Boolean).join(' ')}
    >
      <Icon name={tone === 'error' ? 'circle-alert' : 'circle-check'} size={18} />
      <span>{children}</span>
    </p>
  );
}
