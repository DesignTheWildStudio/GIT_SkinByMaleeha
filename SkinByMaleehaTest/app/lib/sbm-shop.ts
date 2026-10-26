import type {Storefront} from '@shopify/hydrogen';

/**
 * Shop / collection listing helpers. Category and sort live in the URL
 * (`?category=Sun+care&sort=price-desc`) so filtered pages can be linked and shared.
 */

export const SORT_OPTIONS = [
  {value: 'featured', label: 'Featured'},
  {value: 'price-asc', label: 'Price: low to high'},
  {value: 'price-desc', label: 'Price: high to low'},
] as const;

export type ShopSort = (typeof SORT_OPTIONS)[number]['value'];

export type ShopParams = {category: string | null; sort: ShopSort};

export function parseShopParams(searchParams: URLSearchParams): ShopParams {
  const category = searchParams.get('category')?.trim() || null;
  const sort = searchParams.get('sort');
  return {
    category,
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'featured',
  };
}

/** `?category=…&sort=…` for a listing; pagination cursors are dropped so the list restarts. */
export function shopSearch({category, sort}: ShopParams): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (sort !== 'featured') params.set('sort', sort);
  const search = params.toString();
  return search ? `?${search}` : '';
}

/** The chip a (possibly lower-cased) `?category=` value refers to. */
export function findCategory(categories: string[], category: string | null) {
  if (!category) return null;
  const wanted = category.toLowerCase();
  return categories.find((c) => c.toLowerCase() === wanted) ?? null;
}

/** Exact product-type match; the Storefront search syntax alone also matches partial words. */
export function inCategory(product: {productType: string}, category: string | null) {
  return !category || product.productType.toLowerCase() === category.toLowerCase();
}

/** Storefront `products(query:)` search term for a product type. */
export function productTypeQuery(category: string | null) {
  return category ? `product_type:"${category.replace(/["\\]/g, '\\$&')}"` : undefined;
}

export function productSort(sort: ShopSort) {
  return sort === 'featured'
    ? ({sortKey: 'ID', reverse: false} as const)
    : ({sortKey: 'PRICE', reverse: sort === 'price-desc'} as const);
}

export function collectionSort(sort: ShopSort) {
  return sort === 'featured'
    ? ({sortKey: 'COLLECTION_DEFAULT', reverse: false} as const)
    : ({sortKey: 'PRICE', reverse: sort === 'price-desc'} as const);
}

/**
 * The filter chips: every product type in the catalogue, in the order products were
 * added (so the range reads Moisturisers, Sun care, Body). Products without a type are skipped.
 */
export async function loadCategories(storefront: Storefront): Promise<string[]> {
  const {products} = await storefront.query(SHOP_CATEGORIES_QUERY, {
    cache: storefront.CacheShort(),
  });
  const seen = new Set<string>();
  for (const {productType} of products.nodes) {
    const type = productType.trim();
    if (type) seen.add(type);
  }
  return [...seen];
}

/**
 * Splits a title so one word can be set in the italic accent:
 * "The Centella Collection" → ["The ", "Centella", " Collection"], "Face Oils" → ["Face ", "Oils", ""].
 */
export function accentTitle(title: string): [string, string, string] {
  const words = title.trim().split(/\s+/);
  let i = words.length - 1;
  if (words.length > 1 && /^collection$/i.test(words[i])) i -= 1;
  const before = words.slice(0, i).join(' ');
  const after = words.slice(i + 1).join(' ');
  return [before ? `${before} ` : '', words[i] ?? '', after ? ` ${after}` : ''];
}

const SHOP_CATEGORIES_QUERY = `#graphql
  query SbmShopCategories($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 250, sortKey: ID) {
      nodes {
        productType
      }
    }
  }
` as const;
