import type {CSSProperties, ImgHTMLAttributes, ReactNode} from 'react';
import logoPrimaryCharcoal from '~/assets/sbm/logo/logo-primary-charcoal.png';
import logoTaglineSerum from '~/assets/sbm/logo/logo-tagline-serum.png';
import emblemCharcoal from '~/assets/sbm/logo/emblem-charcoal.png';
import signatureCharcoal from '~/assets/sbm/logo/signature-charcoal.png';
import lockupBeKindSerum from '~/assets/sbm/lockups/be-kind-serum.png';
import lockupClaimsSerum from '~/assets/sbm/lockups/claims-serum.png';
import badge24hCharcoal from '~/assets/sbm/badges/badge-24h-charcoal.png';
import badge24hSerum from '~/assets/sbm/badges/badge-24h-serum.png';
import badgeSpf50Charcoal from '~/assets/sbm/badges/badge-spf50-charcoal.png';
import badgeSpf50Serum from '~/assets/sbm/badges/badge-spf50-serum.png';
import badgeAllSkinCharcoal from '~/assets/sbm/badges/badge-all-skin-charcoal.png';
import badgeAllSkinSerum from '~/assets/sbm/badges/badge-all-skin-serum.png';
import badgePhCharcoal from '~/assets/sbm/badges/badge-ph-charcoal.png';
import badgePhSerum from '~/assets/sbm/badges/badge-ph-serum.png';
import badgeGlowCharcoal from '~/assets/sbm/badges/badge-glow-charcoal.png';
import badgeGlowSerum from '~/assets/sbm/badges/badge-glow-serum.png';
import scallopCentella from '~/assets/sbm/elements/scallop-centella.png';

// Brand artwork from the skinbymaleeha guide, shipped as images — never re-typeset.
// Only the tones the storefront uses are bundled; other tones fall back to the
// first one listed for each piece of artwork.

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  style?: CSSProperties;
};

const LOGOS = {
  primary: {w: 1746, h: 349, src: {charcoal: logoPrimaryCharcoal}},
  tagline: {w: 1747, h: 428, src: {serum: logoTaglineSerum}},
} as const;

/** skinbymaleeha wordmark. */
export function Logo({
  variant = 'primary',
  tone,
  width,
  alt = 'skinbymaleeha',
  className = '',
  style,
  ...rest
}: ImgProps & {
  variant?: keyof typeof LOGOS;
  tone?: 'charcoal' | 'serum';
  width: number;
}) {
  const spec = LOGOS[variant];
  const sources = spec.src as Record<string, string>;
  const src = (tone && sources[tone]) || Object.values(sources)[0];
  // explicit width AND height so flex/grid stretch never distorts the artwork
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={('sbm-logo ' + className).trim()}
      style={{
        aspectRatio: `${spec.w} / ${spec.h}`,
        width,
        height: Math.round((width * spec.h) / spec.w),
        ...style,
      }}
      {...rest}
    />
  );
}

/** The script "m" emblem — compact identity for seals, packaging, favicons, social. */
export function Emblem({
  size = 40,
  alt = 'skinbymaleeha emblem',
  className = '',
  style,
  ...rest
}: ImgProps & {size?: number}) {
  return (
    <img
      src={emblemCharcoal}
      alt={alt}
      draggable={false}
      className={('sbm-logo ' + className).trim()}
      style={{height: size, width: Math.round((size * 542) / 319), ...style}}
      {...rest}
    />
  );
}

/** Dr Maleeha Jawaid's signature — a sign-off under informational copy. Not a logo. */
export function Signature({
  width = 220,
  alt = 'Dr. Maleeha Jawaid',
  className = '',
  style,
  ...rest
}: ImgProps & {width?: number}) {
  return (
    <img
      src={signatureCharcoal}
      alt={alt}
      draggable={false}
      className={('sbm-logo ' + className).trim()}
      style={{width, height: Math.round((width * 313) / 1585), ...style}}
      {...rest}
    />
  );
}

const LOCKUPS = {
  'be-kind': {w: 780, h: 119, alt: 'be kind to your skin', src: lockupBeKindSerum},
  claims: {
    w: 915,
    h: 152,
    alt: 'Science backed • Clinically crafted',
    src: lockupClaimsSerum,
  },
} as const;

/** Typographic tagline lock-ups from the brand guide (p.11), as artwork. */
export function Lockup({
  type = 'be-kind',
  height = 32,
  className = '',
  style,
  ...rest
}: ImgProps & {type?: keyof typeof LOCKUPS; height?: number}) {
  const l = LOCKUPS[type];
  return (
    <img
      src={l.src}
      alt={l.alt}
      draggable={false}
      className={('sbm-logo ' + className).trim()}
      style={{height, width: Math.round((height * l.w) / l.h), ...style}}
      {...rest}
    />
  );
}

const BADGES = {
  '24h': {w: 344, h: 344, alt: '24 hours', charcoal: badge24hCharcoal, serum: badge24hSerum},
  spf50: {w: 344, h: 284, alt: 'SPF 50', charcoal: badgeSpf50Charcoal, serum: badgeSpf50Serum},
  'all-skin': {
    w: 377,
    h: 310,
    alt: 'All skin types',
    charcoal: badgeAllSkinCharcoal,
    serum: badgeAllSkinSerum,
  },
  ph: {w: 342, h: 318, alt: 'pH level', charcoal: badgePhCharcoal, serum: badgePhSerum},
  glow: {w: 331, h: 308, alt: 'Glow enhancer', charcoal: badgeGlowCharcoal, serum: badgeGlowSerum},
} as const;

export type InfoBadgeType = keyof typeof BADGES;

export function isInfoBadgeType(value: unknown): value is InfoBadgeType {
  return typeof value === 'string' && value in BADGES;
}

/** Informative brand element (guide p.11) — line-art product claim badge. */
export function InfoBadge({
  type,
  size = 72,
  tone = 'charcoal',
  title,
  className = '',
  style,
  ...rest
}: ImgProps & {
  type: InfoBadgeType;
  size?: number;
  tone?: 'charcoal' | 'serum';
}) {
  const b = BADGES[type];
  return (
    <img
      src={b[tone]}
      alt={title || b.alt}
      draggable={false}
      className={('sbm-logo ' + className).trim()}
      style={{width: size, height: Math.round((size * b.h) / b.w), ...style}}
      {...rest}
    />
  );
}

/** Abstract brand element (guide p.10). Children are centred on top. */
export function BrandShape({
  size = 64,
  title,
  children,
  className = '',
  style,
}: {
  size?: number;
  title?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={('sbm-shape ' + className).trim()}
      style={{width: size, height: Math.round((size * 410) / 407), ...style}}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <img className="sbm-shape__art" src={scallopCentella} alt="" draggable={false} />
      {children != null ? <span className="sbm-shape__content">{children}</span> : null}
    </span>
  );
}
