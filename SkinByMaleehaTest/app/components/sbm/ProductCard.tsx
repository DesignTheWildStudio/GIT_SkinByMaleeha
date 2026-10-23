import type {CSSProperties, ReactNode} from 'react';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {CardProduct} from '~/lib/sbm-product';
import {Badge, Button} from './Controls';
import {InfoBadge} from './Brand';
import {AddToBagButton} from './Bag';

/** Product tile for grids: tinted 4:5 image well, type pill, glyph, caps title, claim, price/size, add to bag. */
export function ProductCard({
  product,
  imageSizes = '(min-width: 961px) 25vw, 50vw',
  loading,
  className = '',
  style,
}: {
  product: CardProduct;
  imageSizes?: string;
  loading?: 'eager' | 'lazy';
  className?: string;
  style?: CSSProperties;
}) {
  const p = product;
  return (
    <article className={['sbm-pcard', className].filter(Boolean).join(' ')} style={style}>
      <Link
        to={p.to}
        prefetch="intent"
        className="sbm-pcard__media"
        style={p.tone ? {background: p.tone} : undefined}
        aria-label={p.title}
      >
        {p.image ? (
          <Image
            data={p.image}
            alt={p.image.altText || p.title}
            sizes={imageSizes}
            loading={loading}
          />
        ) : null}
        {p.typeLabel ? (
          <span className="sbm-pcard__badge">
            <Badge tone={p.badgeTone} size="sm">
              {p.typeLabel}
            </Badge>
          </span>
        ) : null}
        {p.glyph ? (
          <span className="sbm-pcard__glyph">
            <InfoBadge type={p.glyph} size={48} />
          </span>
        ) : null}
      </Link>
      <div className="sbm-pcard__body">
        <h3 className="sbm-pcard__title">
          <Link to={p.to} prefetch="intent">
            {p.title}
          </Link>
        </h3>
        {p.claim ? <p className="sbm-pcard__desc">{p.claim}</p> : null}
        <div className="sbm-pcard__meta">
          <span className="sbm-pcard__price">{p.price}</span>
          {p.size ? <span className="sbm-pcard__size">{p.size}</span> : null}
        </div>
        <div className="sbm-pcard__actions">
          <AddToBagButton
            variantId={p.variantId}
            available={p.available}
            block
            toastMessage={[p.title, p.size].filter(Boolean).join(' · ')}
          />
        </div>
      </div>
    </article>
  );
}

/** Shopify CDN image URL resized server-side to `width` px. */
function resizedUrl(url: string, width: number) {
  const u = new URL(url);
  u.searchParams.set('width', String(width));
  return u.toString();
}

/** The guide's "Colour in use" feature card: colour bands, caps title, copy, image, two outline pills. */
export function FeatureCard({
  title,
  description,
  product,
  topBand = 'var(--sbm-mineral-stone)',
  bottomBand = 'var(--sbm-centella-mist)',
  elevated = false,
  style,
}: {
  title: ReactNode;
  description?: string;
  product: CardProduct;
  topBand?: string;
  bottomBand?: string;
  elevated?: boolean;
  style?: CSSProperties;
}) {
  return (
    <article
      className={['sbm-fcard', elevated ? 'sbm-fcard--elevated' : ''].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="sbm-fcard__band" style={{background: topBand}} />
      <div className="sbm-fcard__body">
        <h3 className="sbm-fcard__title">{title}</h3>
        {description ? <p className="sbm-fcard__copy">{description}</p> : null}
        {product.image ? (
          <div className="sbm-fcard__media">
            {/* plain <img>: the card sizes it with max-height + width:auto, which Image's inline width would override */}
            <img src={resizedUrl(product.image.url, 640)} alt={product.image.altText || ''} loading="lazy" />
          </div>
        ) : null}
        <div className="sbm-fcard__actions">
          <Button variant="outline" size="sm" to={product.to}>
            Discover
          </Button>
          <AddToBagButton
            variantId={product.variantId}
            available={product.available}
            label="Buy Now"
            toastMessage={[product.title, product.size].filter(Boolean).join(' · ')}
          />
        </div>
      </div>
      <div className="sbm-fcard__band sbm-fcard__band--bottom" style={{background: bottomBand}} />
    </article>
  );
}
