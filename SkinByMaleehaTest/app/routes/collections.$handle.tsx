import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import styles from '~/styles/sbm-shop.css?url';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {SBM_PRODUCT_CARD_FRAGMENT} from '~/lib/sbm-product';
import {
  accentTitle,
  collectionSort,
  inCategory,
  loadCategories,
  parseShopParams,
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}, categories] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        ...collectionSort(shopParams.sort),
        // Applied by Shopify when the "Product type" filter is enabled in Search & Discovery;
        // the list is also narrowed below so the chips work either way.
        filters: shopParams.category ? [{productType: shopParams.category}] : [],
      },
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
  return {
    collection: info,
    categories,
    params: shopParams,
    products: {
      ...products,
      nodes: products.nodes.filter((p) => inCategory(p, shopParams.category)),
    },
  };
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
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
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
  ${SBM_PRODUCT_CARD_FRAGMENT}
` as const;
