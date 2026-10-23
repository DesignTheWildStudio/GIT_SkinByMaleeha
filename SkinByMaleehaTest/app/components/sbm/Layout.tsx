import {Suspense, useState, type ReactNode} from 'react';
import {Await, Link, NavLink} from 'react-router';
import type {CartApiQueryFragment, SbmFooterQuery} from 'storefrontapi.generated';
import {Lockup, Logo} from './Brand';
import {Button, Drawer, IconButton, Input} from './Controls';
import {BagIconButton} from './Bag';

const NAV = [
  {to: '/collections/all', label: 'Shop'},
  {to: '/collections/the-centella-collection', label: 'The Centella Collection'},
  {to: '/#founder', label: 'About'},
];

export function Announcement() {
  return (
    <div className="sf-announce">
      Formulated by a dermatologist &nbsp;·&nbsp; Science backed &nbsp;•&nbsp; Clinically crafted
    </div>
  );
}

export function Header({cart}: {cart: Promise<CartApiQueryFragment | null>}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sf-header">
      <div className="sf-wrap sf-header__in">
        <div className="sf-left">
          <span className="sf-menu">
            <IconButton icon="menu" label="Menu" onClick={() => setMenuOpen(true)} />
          </span>
          <nav className="sf-nav" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                prefetch="intent"
                className={({isActive}) => (isActive && !item.to.includes('#') ? 'is-active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Link className="sf-logo" to="/" prefetch="intent" aria-label="skinbymaleeha home">
          <Logo width={208} alt="" />
        </Link>
        <div className="sf-actions">
          <IconButton icon="search" label="Search" to="/search" className="sf-hide-sm" />
          <IconButton icon="user" label="Account" to="/account" className="sf-hide-sm" />
          <BagIconButton cart={cart} />
        </div>
      </div>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" width={360}>
        <nav className="sf-mobile-nav" aria-label="Mobile">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} prefetch="intent" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link to="/search" onClick={() => setMenuOpen(false)}>
            Search
          </Link>
          <Link to="/account" onClick={() => setMenuOpen(false)}>
            Account
          </Link>
        </nav>
      </Drawer>
    </header>
  );
}

type FooterLink = {label: string; to?: string};

const SHOP_LINKS: FooterLink[] = [
  {label: 'All skincare', to: '/collections/all'},
  {label: 'Moisturisers', to: '/collections/all?category=Moisturisers'},
  {label: 'Sun care', to: '/collections/all?category=Sun+care'},
  {label: 'Body', to: '/collections/all?category=Body'},
];

/** Help links point at Shopify policies/pages, and stay plain text until that content exists. */
function helpLinks(data: SbmFooterQuery | null): FooterLink[] {
  return [
    {label: 'Delivery', to: data?.shop.shippingPolicy ? '/policies/shipping-policy' : undefined},
    {label: 'Returns', to: data?.shop.refundPolicy ? '/policies/refund-policy' : undefined},
    {label: 'Contact', to: data?.contact ? `/pages/${data.contact.handle}` : undefined},
    {label: 'FAQs', to: data?.faqs ? `/pages/${data.faqs.handle}` : undefined},
  ];
}

function FooterList({links}: {links: FooterLink[]}) {
  return (
    <ul>
      {links.map((l) => (
        <li key={l.label}>{l.to ? <Link to={l.to}>{l.label}</Link> : l.label}</li>
      ))}
    </ul>
  );
}

export function Footer({footer}: {footer: Promise<SbmFooterQuery | null>}) {
  return (
    <footer className="sf-footer">
      <div className="sf-wrap">
        <div className="sf-footer__top">
          <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
            <Logo variant="tagline" tone="serum" width={250} />
            <Lockup type="be-kind" height={26} />
          </div>
          <div>
            <h4>Shop</h4>
            <FooterList links={SHOP_LINKS} />
          </div>
          <div>
            <h4>Help</h4>
            <Suspense fallback={<FooterList links={helpLinks(null)} />}>
              <Await resolve={footer}>{(data) => <FooterList links={helpLinks(data)} />}</Await>
            </Suspense>
          </div>
          <div>
            <h4>Join our list</h4>
            <p style={{margin: '0 0 16px', font: '300 14px/1.5 var(--font-body)'}}>
              Launch news and skincare notes from Dr Maleeha Jawaid.
            </p>
            <form style={{display: 'flex', gap: 10}} onSubmit={(e) => e.preventDefault()}>
              <Input
                placeholder="Email address"
                type="email"
                name="email"
                aria-label="Email address"
                style={{flex: 1}}
              />
              <Button type="submit">Join</Button>
            </form>
          </div>
        </div>
        <div className="sf-footer__bottom">
          <span>© {new Date().getFullYear()} skinbymaleeha</span>
          <span>Formulated by a dermatologist</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteFrame({
  cart,
  footer,
  children,
}: {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<SbmFooterQuery | null>;
  children: ReactNode;
}) {
  return (
    <>
      <Announcement />
      <Header cart={cart} />
      <main>{children}</main>
      <Footer footer={footer} />
    </>
  );
}
