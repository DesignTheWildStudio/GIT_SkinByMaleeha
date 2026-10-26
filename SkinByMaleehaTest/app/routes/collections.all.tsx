import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import styles from '~/styles/sbm-shop.css?url';
import {SBM_PRODUCT_CARD_FRAGMENT} from '~/lib/sbm-product';
import {
  findCategory,
  inCategory,
  loadCategories,
  parseShopParams,
  productSort,
  productTypeQuery,
} from '~/lib/sbm-shop';
import {ShopListing} from '~/components/sbm/ShopListing';

const INTRO =
  'Gentle, effective formulas for every skin type — each one formulated by a dermatologist.';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.category ?? 'All skincare'} | skinbymaleeha`},
    {name: 'description', content: INTRO},
  ];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const params = parseShopParams(new URL(request.url).searchParams);
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{products}, categories] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {
        ...paginationVariables,
        ...productSort(params.sort),
        query: productTypeQuery(params.category),
      },
    }),
    loadCategories(storefront),
  ]);

  return {
    params,
    categories,
    category: findCategory(categories, params.category),
    products: {
      ...products,
      nodes: products.nodes.filter((p) => inCategory(p, params.category)),
    },
  };
}

export default function Collection() {
  const {params, categories, products} = useLoaderData<typeof loader>();

  return (
    <ShopListing
      eyebrow="Shop"
      title={
        <>
          All <em>skincare</em>
        </>
      }
      intro={INTRO}
      categories={categories}
      params={params}
      products={products}
    />
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/products
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      nodes {
        ...SbmProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${SBM_PRODUCT_CARD_FRAGMENT}
` as const;
