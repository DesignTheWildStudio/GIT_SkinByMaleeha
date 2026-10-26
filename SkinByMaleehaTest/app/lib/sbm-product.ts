import type {SbmProductCardFragment} from 'storefrontapi.generated';
import {toBadgeTone, type BadgeTone} from '~/components/sbm/Controls';
import {isInfoBadgeType, type InfoBadgeType} from '~/components/sbm/Brand';

/**
 * Product fields the skinbymaleeha cards need. The design-specific values live in
 * `custom.*` product metafields (editable in Shopify admin → Products → Metafields).
 */
export const SBM_PRODUCT_CARD_FRAGMENT = `#graphql
  fragment SbmProductCard on Product {
    id
    handle
    title
    productType
    description
    availableForSale
    featuredImage {
      id
      url
      altText
      width
      height
    }
    selectedOrFirstAvailableVariant {
      id
      availableForSale
      price {
        amount
        currencyCode
      }
    }
    typeLabel: metafield(namespace: "custom", key: "type_label") {
      value
    }
    claim: metafield(namespace: "custom", key: "claim") {
      value
    }
    size: metafield(namespace: "custom", key: "size") {
      value
    }
    badgeTone: metafield(namespace: "custom", key: "badge_tone") {
      value
    }
    glyph: metafield(namespace: "custom", key: "glyph") {
      value
    }
    tone: metafield(namespace: "custom", key: "tone") {
      value
    }
  }
` as const;

/** Brand palette names accepted by the `custom.tone` metafield. */
const TONES: Record<string, string> = {
  serum: 'var(--sbm-serum)',
  white: 'var(--sbm-white)',
  'aloe-dew': 'var(--sbm-aloe-dew)',
  'cloud-mask': 'var(--sbm-cloud-mask)',
  'centella-mist': 'var(--sbm-centella-mist)',
  'rice-milk': 'var(--sbm-rice-milk)',
  'clay-mask': 'var(--sbm-clay-mask)',
  'mineral-stone': 'var(--sbm-mineral-stone)',
};

export function toneVar(value: string | null | undefined): string | undefined {
  return value ? TONES[value] : undefined;
}

export type MoneyLike = {amount?: string; currencyCode?: string};

/** "Rs 3,450" for PKR (as on the brand storefront); standard currency format otherwise. */
export function formatPrice(money: MoneyLike | null | undefined): string {
  if (!money?.amount || !money.currencyCode) return '';
  const n = Number(money.amount);
  if (money.currencyCode === 'PKR') {
    return 'Rs ' + n.toLocaleString('en-PK', {maximumFractionDigits: 0});
  }
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(n);
}

export type CardProduct = {
  id: string;
  handle: string;
  to: string;
  title: string;
  description: string;
  claim: string;
  typeLabel?: string;
  badgeTone: BadgeTone;
  glyph?: InfoBadgeType;
  tone?: string;
  size?: string;
  price: string;
  image: SbmProductCardFragment['featuredImage'];
  variantId?: string;
  /** Shape of a cart line's merchandise, for the optimistic bag line while adding. */
  optimisticVariant?: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: MoneyLike;
    image: SbmProductCardFragment['featuredImage'];
    selectedOptions: never[];
    product: {
      handle: string;
      title: string;
      featuredImage: SbmProductCardFragment['featuredImage'];
      size: SbmProductCardFragment['size'];
      tone: SbmProductCardFragment['tone'];
    };
  };
  available: boolean;
};

export function toCardProduct(product: SbmProductCardFragment): CardProduct {
  const variant = product.selectedOrFirstAvailableVariant;
  const glyph = product.glyph?.value;
  return {
    id: product.id,
    handle: product.handle,
    to: `/products/${product.handle}`,
    title: product.title,
    description: product.description,
    claim: product.claim?.value ?? '',
    typeLabel: product.typeLabel?.value ?? undefined,
    badgeTone: toBadgeTone(product.badgeTone?.value),
    glyph: isInfoBadgeType(glyph) ? glyph : undefined,
    tone: toneVar(product.tone?.value),
    size: product.size?.value ?? undefined,
    price: formatPrice(variant?.price),
    image: product.featuredImage,
    variantId: variant?.id,
    optimisticVariant: variant
      ? {
          id: variant.id,
          title: 'Default Title',
          availableForSale: variant.availableForSale,
          price: variant.price,
          image: product.featuredImage,
          selectedOptions: [],
          product: {
            handle: product.handle,
            title: product.title,
            featuredImage: product.featuredImage,
            size: product.size,
            tone: product.tone,
          },
        }
      : undefined,
    available: Boolean(variant?.availableForSale),
  };
}
