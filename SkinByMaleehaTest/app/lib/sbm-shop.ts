import {getPaginationVariables, type Storefront} from '@shopify/hydrogen';
import type {SbmProductCardFragment} from 'storefrontapi.generated';
import {SBM_PRODUCT_CARD_FRAGMENT} from '~/lib/sbm-product';

/**
 * Shop / collection listing helpers. Category and sort live in the URL
 * (`?category=Sun+care&sort=price-desc`) so filtered pages can be linked and shared.
 */

export const PAGE_BY = 12;

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

type PaginationVariables = ReturnType<typeof getPaginationVariables>;

/** A filtered list pages by offset (see pageOf); its cursors are plain numbers. */
const OFFSET_CURSOR = /^\d+$/;

/**
 * Pagination variables for a listing. Unfiltered lists page with Shopify's cursors; an offset
 * cursor left over from a filtered list would be rejected by Shopify, so that list starts over.
 */
export function shopPagination(request: Request, category: string | null): PaginationVariables {
  const variables = getPaginationVariables(request, {pageBy: PAGE_BY});
  const cursor = 'last' in variables ? variables.startCursor : variables.endCursor;
  return !category && cursor && OFFSET_CURSOR.test(cursor)
    ? {first: PAGE_BY, endCursor: null}
    : variables;
}

type ScanPage = {
  nodes: Array<{id: string; productType: string}>;
  pageInfo: {hasNextPage: boolean; endCursor?: string | null};
};

/** At most 4 requests of 250 products are scanned for one filtered listing. */
const SCAN_PAGES = 4;

/**
 * One page of a category, filtered *before* paginating. Shopify's own narrowing is loose:
 * `product_type:` search also matches partial words, and collection `productType` filters
 * only apply once that filter is enabled in Search & Discovery. So the candidates are scanned
 * (ids and types only, from `first`, then `fetchNext(endCursor)`), the exact matches cut into
 * a page, and only that page's cards are loaded. Counts, "Load more" and the empty state are exact.
 */
export async function loadCategoryPage(
  storefront: Storefront,
  {
    category,
    pagination,
    first,
    fetchNext,
  }: {
    category: string;
    pagination: PaginationVariables;
    first: ScanPage;
    fetchNext: (after: string) => Promise<ScanPage | null | undefined>;
  },
) {
  const ids: string[] = [];
  let scan: ScanPage | null | undefined = first;
  for (let fetched = 1; scan; fetched++) {
    for (const product of scan.nodes) {
      if (inCategory(product, category)) ids.push(product.id);
    }
    const {hasNextPage, endCursor}: ScanPage['pageInfo'] = scan.pageInfo;
    scan = hasNextPage && endCursor && fetched < SCAN_PAGES ? await fetchNext(endCursor) : null;
  }

  const {items, pageInfo} = pageOf(ids, pagination);
  return {nodes: await loadProductCards(storefront, items), pageInfo};
}

/** Cuts the page Hydrogen's pagination variables ask for out of a complete list; cursors are offsets. */
function pageOf<T>(list: T[], pagination: PaginationVariables) {
  const offset = (cursor: string | null) =>
    cursor && OFFSET_CURSOR.test(cursor) ? Number(cursor) : null;
  let start: number;
  let end: number;
  if ('last' in pagination) {
    end = Math.min(offset(pagination.startCursor) ?? list.length, list.length);
    start = Math.max(0, end - pagination.last);
  } else {
    const after = offset(pagination.endCursor);
    start = Math.min(after === null ? 0 : after + 1, list.length);
    end = Math.min(start + pagination.first, list.length);
  }
  return {
    items: list.slice(start, end),
    pageInfo: {
      hasPreviousPage: start > 0,
      hasNextPage: end < list.length,
      startCursor: start < end ? String(start) : null,
      endCursor: start < end ? String(end - 1) : null,
    },
  };
}

async function loadProductCards(
  storefront: Storefront,
  ids: string[],
): Promise<SbmProductCardFragment[]> {
  if (!ids.length) return [];
  const {nodes} = await storefront.query(SHOP_CARDS_QUERY, {variables: {ids}});
  // `nodes` keeps the order of `ids`; a product unpublished since the scan comes back null.
  return nodes.filter(
    (node): node is Extract<typeof node, {__typename: 'Product'}> =>
      node?.__typename === 'Product',
  );
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

const SHOP_CARDS_QUERY = `#graphql
  query SbmShopCards($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ...SbmProductCard
    }
  }
  ${SBM_PRODUCT_CARD_FRAGMENT}
` as const;
