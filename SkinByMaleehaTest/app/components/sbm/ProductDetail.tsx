import {useState, type CSSProperties, type ReactNode} from 'react';
import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {Accordion, type AccordionItem} from './Accordion';
import {InfoBadge, isInfoBadgeType, type InfoBadgeType} from './Brand';
import {Icon} from './Icon';
import {Tooltip} from './Tooltip';

/** Value of a `list.*` metafield (a JSON array string) as clean strings. */
export function parseListMetafield(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  } catch {
    return [];
  }
}

/** Home › Shop › product title. */
export function Breadcrumbs({title}: {title: string}) {
  return (
    <nav className="sf-crumbs" aria-label="Breadcrumb">
      <Link to="/" prefetch="intent">
        Home
      </Link>
      <Icon name="chevron-right" size={14} />
      <Link to="/collections/all" prefetch="intent">
        Shop
      </Link>
      <Icon name="chevron-right" size={14} />
      <span className="sf-crumbs__current" aria-current="page">
        {title}
      </span>
    </nav>
  );
}

export type GalleryImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Pack shots much taller than the 4:5 frame (the upright carton) are shown whole on serum-deep. */
function fitFor(image: GalleryImage): 'cover' | 'contain' {
  return image.width && image.height && image.width / image.height < 0.6 ? 'contain' : 'cover';
}

/** How much wider than the 4:5 frame a cover image renders, so srcset picks a sharp enough file. */
function coverScale(image: GalleryImage) {
  if (fitFor(image) === 'contain' || !image.width || !image.height) return 1;
  return Math.max(1, Math.round((image.width / image.height / 0.8) * 100) / 100);
}

/** Thumbnail column + 4:5 main image; clicking a thumb swaps the main image. */
export function ProductGallery({
  images,
  title,
  tone,
  activeImageId,
}: {
  images: GalleryImage[];
  title: string;
  /** Brand tone behind cover images (`custom.tone`). */
  tone?: string;
  /** The selected variant's image — the gallery jumps to it when the variant changes. */
  activeImageId?: string | null;
}) {
  const indexOf = (id?: string | null) => (id ? images.findIndex((img) => img.id === id) : -1);
  const [index, setIndex] = useState(() => Math.max(0, indexOf(activeImageId)));
  const [prevActive, setPrevActive] = useState(activeImageId);
  if (activeImageId !== prevActive) {
    setPrevActive(activeImageId);
    const i = indexOf(activeImageId);
    if (i > -1) setIndex(i);
  }

  const cur = images[index] ?? images[0];
  const fit = cur ? fitFor(cur) : 'cover';
  const scale = cur ? coverScale(cur) : 1;
  const mainStyle: CSSProperties = {
    backgroundColor: fit === 'contain' ? 'var(--sbm-serum-deep)' : tone,
  };

  return (
    <div className={['sf-gallery', images.length < 2 ? 'sf-gallery--single' : ''].filter(Boolean).join(' ')}>
      {images.length > 1 ? (
        <div className="sf-thumbs">
          {images.map((img, i) => (
            <button
              key={img.id ?? img.url}
              type="button"
              aria-label={'Image ' + (i + 1)}
              aria-pressed={i === index}
              className={'sf-thumb' + (i === index ? ' is-active' : '')}
              onClick={() => setIndex(i)}
            >
              <Image data={img} alt="" sizes={`calc(${coverScale(img)} * 88px)`} />
            </button>
          ))}
        </div>
      ) : null}
      <div className="sf-main-img" style={mainStyle}>
        {cur ? (
          <Image
            key={cur.id ?? cur.url}
            data={cur}
            alt={cur.altText || title}
            className={fit === 'contain' ? 'is-contain' : undefined}
            loading="eager"
            sizes={`(min-width: 961px) calc(${scale} * 40vw), calc(${scale} * 70vw)`}
          />
        ) : null}
      </div>
    </div>
  );
}

const BADGE_TIPS: Record<InfoBadgeType, string> = {
  '24h': 'Hydration that lasts 24 hours',
  'all-skin': 'Suitable for all skin types',
  ph: 'pH balanced for skin',
  spf50: 'Broad-spectrum SPF 50',
  glow: 'Glow enhancer',
};

/** Line-art claim badges (`custom.claim_badges`) with a hover hint. */
export function ClaimBadges({badges}: {badges: string[]}) {
  const types = badges.filter(isInfoBadgeType);
  if (!types.length) return null;
  return (
    <div className="sf-row sf-pdp__badges">
      {types.map((b) => (
        <Tooltip key={b} content={BADGE_TIPS[b]}>
          <InfoBadge type={b} size={64} />
        </Tooltip>
      ))}
    </div>
  );
}

/** Two-column ticked claims (`custom.checklist`). */
export function Checklist({items}: {items: string[]}) {
  if (!items.length) return null;
  return (
    <ul className="sf-checks">
      {items.map((c) => (
        <li key={c}>
          <Icon name="check" size={16} strokeWidth={2} />
          {c}
        </li>
      ))}
    </ul>
  );
}

/** Packaging-style details; only sections with content are shown, the first one open. */
export function ProductDetails({
  inside,
  ingredients,
  directions,
}: {
  inside?: string | null;
  ingredients?: string | null;
  directions?: string | null;
}) {
  const sections: Array<AccordionItem | null> = [
    inside ? {title: "What's inside", content: inside} : null,
    ingredients ? {title: 'Ingredients', content: ingredients} : null,
    directions ? {title: 'Directions to use', content: directions} : null,
  ];
  const items = sections.filter((it): it is AccordionItem => it !== null);
  if (!items.length) return null;
  return <Accordion className="sf-pdp__details" items={items} defaultOpen={[0]} />;
}

/** Outline pill chip — selectable filter (onClick) or removable token (onRemove). Port of the design system Tag. */
export function Tag({
  selected = false,
  onClick,
  onRemove,
  disabled,
  className = '',
  style,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const cls = ['sbm-tag', selected ? 'sbm-tag--selected' : '', className]
    .filter(Boolean)
    .join(' ');
  if (onRemove) {
    return (
      <span className={cls} style={style}>
        {children}
        <button type="button" className="sbm-tag__remove" aria-label="Remove" onClick={onRemove}>
          <Icon name="x" size={14} />
        </button>
      </span>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={style}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}
