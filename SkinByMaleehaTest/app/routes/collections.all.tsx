import type {Route} from './+types/collections.all';
import {useLoaderData} from 'react-router';
import styles from '~/styles/sbm-shop.css?url';
import {SBM_PRODUCT_CARD_FRAGMENT} from '~/lib/sbm-product';
import {
  findCategory,
  loadCategories,
  loadCategoryPage,
  parseShopParams,
  productSort,
  productTypeQuery,
  shopPagination,
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
  const {category} = params;
  const pagination = shopPagination(request, category);

  if (category) {
    // product_type: search narrows the scan; loadCategoryPage keeps only exact matches.
    const scan = async (after: string | null) => {
      const {products} = await storefront.query(CATALOG_SCAN_QUERY, {
        variables: {after, query: productTypeQuery(category), ...productSort(params.sort)},
      });
      return products;
    };
    const [first, categories] = await Promise.all([scan(null), loadCategories(storefront)]);
    return {
      params,
      categories,
      category: findCategory(categories, category),
      products: await loadCategoryPage(storefront, {
        category,
        pagination,
        first,
        fetchNext: scan,
      }),
    };
  }

  const [{products}, categories] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...pagination, ...productSort(params.sort)},
    }),
    loadCategories(storefront),
  ]);

  return {params, categories, category: null, products};
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
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
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
        startCursor
        endCursor
      }
    }
  }
  ${SBM_PRODUCT_CARD_FRAGMENT}
` as const;

/** Ids and types only: the candidates a category page is cut from (see loadCategoryPage). */
const CATALOG_SCAN_QUERY = `#graphql
  query CatalogScan(
    $country: CountryCode
    $language: LanguageCode
    $after: String
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(first: 250, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
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
` as const;
