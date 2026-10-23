import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {Link} from 'react-router';
import {Icon, type IconName} from './Icon';
import {BrandShape} from './Brand';

type ButtonVariant = 'primary' | 'outline' | 'white' | 'inverse' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  block?: boolean;
  /** Internal route — renders a router <Link>. */
  to?: string;
  /** External URL (e.g. Shopify checkout) — renders an <a>. */
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  prefetch?: 'intent' | 'render' | 'viewport' | 'none';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  'aria-label'?: string;
};

/** Pill button. Charcoal solid, charcoal outline (guide "Discover / Buy Now"), white (guide banner), inverse, link. */
export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  block = false,
  to,
  href,
  type = 'button',
  disabled = false,
  className = '',
  children,
  prefetch = 'intent',
  style,
  onClick,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const cls = [
    'sbm-btn',
    'sbm-btn--' + variant,
    size !== 'md' ? 'sbm-btn--' + size : '',
    block ? 'sbm-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const s = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const inner = (
    <>
      {iconLeft ? <Icon name={iconLeft} size={s} /> : null}
      <span>{children}</span>
      {iconRight ? <Icon name={iconRight} size={s} /> : null}
    </>
  );
  const shared = {className: cls, style, onClick, 'aria-label': ariaLabel};
  if (to) {
    return (
      <Link to={to} prefetch={prefetch} aria-disabled={disabled || undefined} {...shared}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} aria-disabled={disabled || undefined} {...shared}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} {...shared}>
      {inner}
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  icon: IconName;
  label: string;
  variant?: 'ghost' | 'outline' | 'solid' | 'white';
  size?: 'sm' | 'md' | 'lg';
  count?: number | null;
  active?: boolean;
  iconSize?: number;
  type?: 'button' | 'submit';
  /** Internal route — renders a router <Link> styled as an icon button. */
  to?: string;
};

/** Circular icon-only button with optional count bubble (bag). */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  count,
  active = false,
  iconSize,
  type = 'button',
  className = '',
  to,
  ...rest
}: IconButtonProps) {
  const cls = [
    'sbm-iconbtn',
    'sbm-iconbtn--' + variant,
    size !== 'md' ? 'sbm-iconbtn--' + size : '',
    active ? 'is-active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const s = iconSize || (size === 'sm' ? 18 : size === 'lg' ? 22 : 20);
  const inner = (
    <>
      <Icon name={icon} size={s} />
      {count != null && count !== 0 ? <span className="sbm-iconbtn__count">{count}</span> : null}
    </>
  );
  if (to) {
    return (
      <Link to={to} prefetch="intent" className={cls} aria-label={label} style={rest.style}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={cls}
      aria-label={label}
      aria-pressed={active || undefined}
      {...rest}
    >
      {inner}
    </button>
  );
}

export type BadgeTone =
  | 'aloe'
  | 'cloud'
  | 'centella'
  | 'rice'
  | 'clay'
  | 'mineral'
  | 'serum'
  | 'charcoal'
  | 'outline';

const BADGE_TONES: BadgeTone[] = [
  'aloe',
  'cloud',
  'centella',
  'rice',
  'clay',
  'mineral',
  'serum',
  'charcoal',
  'outline',
];

export function toBadgeTone(value: string | null | undefined): BadgeTone {
  return BADGE_TONES.includes(value as BadgeTone) ? (value as BadgeTone) : 'aloe';
}

/** Small tinted label — the packaging "daily moisturiser" pill, or a serif caps collection tag. */
export function Badge({
  tone = 'aloe',
  size = 'md',
  serif = false,
  caps = false,
  icon,
  className = '',
  children,
}: {
  tone?: BadgeTone;
  size?: 'sm' | 'md' | 'lg';
  serif?: boolean;
  caps?: boolean;
  icon?: IconName;
  className?: string;
  children?: ReactNode;
}) {
  const cls = [
    'sbm-badge',
    'sbm-badge--' + tone,
    size !== 'md' ? 'sbm-badge--' + size : '',
    serif ? 'sbm-badge--serif' : '',
    caps ? 'sbm-badge--caps' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls}>
      {icon ? <Icon name={icon} size={size === 'lg' ? 16 : 14} /> : null}
      {children}
    </span>
  );
}

/** Pill text field with caps label, optional leading icon, hint and error. */
export function Input({
  label,
  hint,
  error,
  icon,
  id,
  disabled = false,
  className = '',
  style,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string | boolean;
  icon?: IconName;
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
        {icon ? (
          <span className="sbm-field__icon">
            <Icon name={icon} size={18} />
          </span>
        ) : null}
        <input
          id={fid}
          className="sbm-field__input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </div>
      {msg ? <span className="sbm-field__hint">{msg}</span> : null}
    </div>
  );
}

/**
 * − value + pill stepper. The two buttons are passed in as slots so each can be
 * wrapped in its own cart form (see BagLines); `sbm-qty form` is display:contents.
 */
export function QuantityStepper({
  value,
  decrease,
  increase,
  size = 'md',
  label = 'Quantity',
  className = '',
}: {
  value: number;
  decrease: ReactNode;
  increase: ReactNode;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={['sbm-qty', size === 'sm' ? 'sbm-qty--sm' : '', className]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label={label}
    >
      {decrease}
      <span className="sbm-qty__value" aria-live="polite">
        {value}
      </span>
      {increase}
    </div>
  );
}

/** A stepper button: `−` or `+` inside the pill. */
export function QuantityStepperButton({
  direction,
  disabled,
  type = 'button',
  onClick,
}: {
  direction: 'decrease' | 'increase';
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      className="sbm-qty__btn"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'decrease' ? 'Decrease' : 'Increase'}
    >
      <Icon name={direction === 'decrease' ? 'minus' : 'plus'} size={16} />
    </button>
  );
}

/** Right-hand sheet (bag, menu). Serum panel over a charcoal scrim. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 440,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="sbm-drawer-scrim" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={['sbm-drawer', className].filter(Boolean).join(' ')}
        style={{width: `min(100%, ${width}px)`}}
      >
        <div className="sbm-drawer__head">
          <h2 className="sbm-drawer__title">{title}</h2>
          <IconButton icon="x" label="Close" size="sm" onClick={onClose} />
        </div>
        <div className="sbm-drawer__body">{children}</div>
        {footer ? <div className="sbm-drawer__foot">{footer}</div> : null}
      </aside>
    </>
  );
}

const TOAST_TONES = {
  success: 'check',
  info: 'info',
  error: 'circle-alert',
} as const;

/** Charcoal pill notification led by the scallop seal (Centella Mist + check = the guide's "confirmed" mark). */
export function Toast({
  tone = 'success',
  title,
  message,
  action,
  onAction,
  onClose,
}: {
  tone?: keyof typeof TOAST_TONES;
  title: ReactNode;
  message?: ReactNode;
  action?: string;
  onAction?: () => void;
  onClose?: () => void;
}) {
  return (
    <div role="status" className="sbm-toast">
      <BrandShape size={40} className="sbm-toast__icon">
        <Icon name={TOAST_TONES[tone]} size={18} strokeWidth={2} />
      </BrandShape>
      <span className="sbm-toast__text">
        <span className="sbm-toast__title">{title}</span>
        {message ? <span className="sbm-toast__msg">{message}</span> : null}
      </span>
      {action ? (
        <button type="button" className="sbm-toast__action" onClick={onAction}>
          {action}
        </button>
      ) : null}
      {onClose ? (
        <IconButton
          icon="x"
          label="Dismiss"
          size="sm"
          onClick={onClose}
          style={{color: 'inherit'}}
        />
      ) : null}
    </div>
  );
}
