import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {Analytics} from '@shopify/hydrogen';
import styles from '~/styles/sbm-shop.css?url';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {SBM_PRODUCT_CARD_FRAGMENT} from '~/lib/sbm-product';
import {
  accentTitle,
  collectionSort,
  loadCategories,
  loadCategoryPage,
  parseShopParams,
  shopPagination,
} from '~/lib/sbm-shop';
import {AccentTitle, ShopListing} from '~/components/sbm/ShopListing';

/** Used when a collection has no description in Shopify (as the design does). */
const DEFAULT_INTRO =
  'Gentle, effective formulas for every skin type — each one formulated by a dermatologist.';

export const meta: Route.MetaFunction = ({data}) => {
  const collection = data?.collection;
  return [
    {title: `${collection?.seo.title || collection?.title || 'Collection'} | skinbymaleeha`},
    {
      name: 'description',
      content: collection?.seo.description || collection?.description || DEFAULT_INTRO,
    },
  ];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const shopParams = parseShopParams(new URL(request.url).searchParams);
  const {category} = shopParams;
  const pagination = shopPagination(request, category);

  if (!handle) {
    throw redirect('/collections');
  }

  if (category) {
    // Shopify applies the productType filter only once it is enabled in Search & Discovery;
    // loadCategoryPage keeps only exact matches either way.
    const scan = async (after: string | null) => {
      const {collection} = await storefront.query(COLLECTION_SCAN_QUERY, {
        variables: {
          handle,
          after,
          filters: [{productType: category}],
          ...collectionSort(shopParams.sort),
        },
      });
      return collection;
    };
    const [collection, categories] = await Promise.all([
      scan(null),
      loadCategories(storefront),
    ]);
    if (!collection) {
      throw new Response(`Collection ${handle} not found`, {status: 404});
    }
    redirectIfHandleIsLocalized(request, {handle, data: collection});

    const {products: first, ...info} = collection;
    return {
      collection: info,
      categories,
      params: shopParams,
      products: await loadCategoryPage(storefront, {
        category,
        pagination,
        first,
        fetchNext: async (after) => (await scan(after))?.products,
      }),
    };
  }

  const [{collection}, categories] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...pagination, ...collectionSort(shopParams.sort)},
    }),
    loadCategories(storefront),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  const {products, ...info} = collection;
  return {collection: info, categories, params: shopParams, products};
}

export default function Collection() {
  const {collection, categories, params, products} = useLoaderData<typeof loader>();

  return (
    <>
      <ShopListing
        eyebrow="Collection"
        title={<AccentTitle parts={accentTitle(collection.title)} />}
        intro={collection.description || DEFAULT_INTRO}
        categories={categories}
        params={params}
        products={products}
      />
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </>
  );
}

const COLLECTION_INFO_FRAGMENT = `#graphql
  fragment SbmCollectionInfo on Collection {
    id
    handle
    title
    description
    seo {
      title
      description
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/collection
const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...SbmCollectionInfo
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          ...SbmProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  ${COLLECTION_INFO_FRAGMENT}
  ${SBM_PRODUCT_CARD_FRAGMENT}
` as const;

/** Ids and types only: the candidates a category page is cut from (see loadCategoryPage). */
const COLLECTION_SCAN_QUERY = `#graphql
  query CollectionScan(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $after: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...SbmCollectionInfo
      products(
        first: 250
        after: $after
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          id
          productType
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
  ${COLLECTION_INFO_FRAGMENT}
` as const;
