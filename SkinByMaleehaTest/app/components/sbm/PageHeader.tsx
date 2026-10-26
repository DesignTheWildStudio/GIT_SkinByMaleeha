import {Fragment, type ReactNode} from 'react';
import {Link} from 'react-router';
import {Icon} from './Icon';

/**
 * The design sets one word of each heading in the italic accent ("The <em>range</em>").
 * For titles that come from Shopify, the last word takes the accent.
 */
export function accentTitle(title: string): ReactNode {
  const words = title.trim().split(/\s+/);
  const last = words.pop() ?? '';
  if (!words.length) return <em>{last}</em>;
  return (
    <>
      {words.join(' ')} <em>{last}</em>
    </>
  );
}

export type Crumb = {label: string; to?: string};

/** Home › … › current page, as on the product page. */
export function PageCrumbs({items}: {items: Crumb[]}) {
  const trail: Crumb[] = [{label: 'Home', to: '/'}, ...items];
  return (
    <nav className="sf-crumbs" aria-label="Breadcrumb">
      {trail.map((item, i) => {
        const last = i === trail.length - 1;
        return (
          <Fragment key={`${item.to ?? ''}|${item.label}`}>
            {i > 0 ? <Icon name="chevron-right" size={14} /> : null}
            {last || !item.to ? (
              <span className="sf-crumbs__current" aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <Link to={item.to} prefetch="intent">
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

/** Eyebrow, caps display heading and optional lede — the Shop page's header. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  crumbs,
  aside,
  size = 'display',
  className = '',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  crumbs?: Crumb[];
  aside?: ReactNode;
  size?: 'display' | 'h1';
  className?: string;
}) {
  return (
    <header className={['sf-pagehead', className].filter(Boolean).join(' ')}>
      {crumbs ? <PageCrumbs items={crumbs} /> : null}
      <div className="sf-pagehead__row">
        <div className="sf-pagehead__intro">
          {eyebrow ? <p className="sbm-eyebrow">{eyebrow}</p> : null}
          <h1 className={size === 'display' ? 'sbm-display-m' : 'sbm-h1'}>{title}</h1>
          {lede ? <p className="sbm-body sf-pagehead__lede">{lede}</p> : null}
        </div>
        {aside ? <div className="sf-pagehead__aside">{aside}</div> : null}
      </div>
    </header>
  );
}

/** A section heading inside a page: caps serif title, optional count/meta on the right. */
export function PageSectionHead({
  title,
  meta,
  as: Tag = 'h2',
}: {
  title: ReactNode;
  meta?: ReactNode;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="sf-sectionhead">
      <Tag className="sbm-h3">{title}</Tag>
      {meta ? <span className="sbm-caption">{meta}</span> : null}
    </div>
  );
}

export type PageLink = {id?: string; to: string; label: ReactNode; meta?: ReactNode};

/** Hairline list of links — pages, policies, journal entries. */
export function PageLinkList({items, className = ''}: {items: PageLink[]; className?: string}) {
  return (
    <ul className={['sf-linklist', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <li key={item.id ?? item.to}>
          <PageLinkRow {...item} />
        </li>
      ))}
    </ul>
  );
}

/** One row of a PageLinkList (use inside any `.sf-linklist` container, e.g. a paginated one). */
export function PageLinkRow({to, label, meta}: PageLink) {
  return (
    <Link to={to} prefetch="intent" className="sf-linklist__link">
      <span className="sf-linklist__label">{label}</span>
      {meta ? <span className="sf-linklist__meta">{meta}</span> : null}
      <Icon name="arrow-right" size={18} />
    </Link>
  );
}

/** Rounded info box for empty states: a short message and the next step. */
export function PageEmpty({
  title,
  children,
  actions,
}: {
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="sbm-card sf-box sf-empty">
      {title ? <p className="sbm-h4">{title}</p> : null}
      {children ? <p className="sbm-body sf-empty__copy">{children}</p> : null}
      {actions ? <div className="sf-row sf-empty__actions">{actions}</div> : null}
    </div>
  );
}

/** Shopify-authored HTML (pages, policies, articles) in the readable text column. */
export function RichText({html, className = ''}: {html: string; className?: string}) {
  return (
    <div
      className={['sf-rte', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}

/** "12 October 2026". UTC on server and client alike, so hydration never disagrees. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}
