import type {CSSProperties} from 'react';
import {Form, NavLink} from 'react-router';
import {Badge, Button, type BadgeTone} from './Controls';

const ACCOUNT_NAV = [
  {to: '/account/orders', label: 'Orders'},
  {to: '/account/profile', label: 'Profile'},
  {to: '/account/addresses', label: 'Addresses'},
];

/** Underline tabs (small tracked caps) for the account sections, with sign out on the right. */
export function AccountNav() {
  return (
    <div className="sf-account__bar">
      <nav className="sbm-tabs sf-account__tabs" aria-label="Account">
        {ACCOUNT_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} prefetch="intent" className="sbm-tab">
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Form method="POST" action="/account/logout" className="sf-account__signout">
        <Button type="submit" variant="link" size="sm">
          Sign out
        </Button>
      </Form>
    </div>
  );
}

/** "#1003" or 1003 → # in the body face (Bodoni's is hairline-thin), digits in the heading face. */
export function OrderNumber({value}: {value: string | number}) {
  return (
    <>
      <span className="sf-hash">#</span>
      {String(value).replace(/^#/, '')}
    </>
  );
}

/** "PARTIALLY_FULFILLED" → "Partially fulfilled". */
export function humanizeStatus(status: string | null | undefined): string {
  if (!status) return '';
  const words = status.toLowerCase().split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const STATUS_TONES: Record<string, BadgeTone> = {
  PAID: 'centella',
  FULFILLED: 'centella',
  SUCCESS: 'centella',
  AUTHORIZED: 'cloud',
  PENDING: 'cloud',
  PARTIALLY_PAID: 'cloud',
  IN_PROGRESS: 'cloud',
  PARTIALLY_FULFILLED: 'cloud',
  PENDING_FULFILLMENT: 'cloud',
  READY_FOR_DELIVERY: 'cloud',
  READY_FOR_PICKUP: 'cloud',
  OPEN: 'aloe',
  UNFULFILLED: 'aloe',
  SCHEDULED: 'aloe',
  ON_HOLD: 'rice',
  REFUNDED: 'rice',
  PARTIALLY_REFUNDED: 'rice',
  VOIDED: 'rice',
  EXPIRED: 'rice',
  RESTOCKED: 'rice',
  CANCELLED: 'rice',
};

/** Order payment / fulfilment status as a small tinted badge. */
export function StatusBadge({status}: {status: string | null | undefined}) {
  if (!status) return null;
  return (
    <Badge tone={STATUS_TONES[status] ?? 'outline'} size="sm">
      {humanizeStatus(status)}
    </Badge>
  );
}

export const ORDER_STEPS = ['Placed', 'Packed', 'Shipped'];

/** Which ORDER_STEPS step an order's display fulfilment status has reached. */
export function orderStep(fulfillmentStatus: string | null | undefined): number {
  switch (fulfillmentStatus) {
    case 'FULFILLED':
    case 'READY_FOR_DELIVERY':
    case 'READY_FOR_PICKUP':
      return 2;
    case 'IN_PROGRESS':
    case 'PARTIALLY_FULFILLED':
    case 'PENDING_FULFILLMENT':
      return 1;
    default:
      return 0;
  }
}

/** Order progress — dots on a line inside a Mineral Stone block (brand guide p.16). */
export function OrderTracker({
  steps = ORDER_STEPS,
  current = 0,
  tone = 'mineral',
  className = '',
  style,
}: {
  steps?: string[];
  current?: number;
  tone?: 'mineral' | 'cloud' | 'aloe' | 'clay';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={['sbm-track', tone !== 'mineral' ? 'sbm-track--' + tone : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <ol className="sbm-track__rail" style={{'--_n': steps.length} as CSSProperties}>
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? 'step' : undefined}
            className={[
              'sbm-track__step',
              i <= current ? 'sbm-track__step--done' : '',
              i === current ? 'sbm-track__step--current' : '',
              i < current ? 'sbm-track__step--seg-done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="sbm-track__dot" />
            <span className="sbm-track__label">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

