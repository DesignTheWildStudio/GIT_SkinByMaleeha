import {useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import styles from '~/styles/sbm-product.css?url';
import {ProductForm} from '~/components/ProductForm';
import {Badge, toBadgeTone} from '~/components/sbm/Controls';
import {
  Breadcrumbs,
  Checklist,
  ClaimBadges,
  ProductDetails,
  ProductGallery,
  parseListMetafield,
} from '~/components/sbm/ProductDetail';
import {formatPrice, toneVar} from '~/lib/sbm-product';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product;
  if (!product) return [{title: 'Product | skinbymaleeha'}];
  const description = product.seo.description || product.description;
  return [
    {title: `${product.title} | skinbymaleeha`},
    ...(description ? [{name: 'description', content: description}] : []),
    {tagName: 'link', rel: 'canonical', href: `/products/${product.handle}`},
  ];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData(_args: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;
  const typeLabel = product.typeLabel?.value;
  const claim = product.claim?.value;
  const size = product.size?.value;
  const optionLabel =
    selectedVariant?.title && selectedVariant.title !== 'Default Title'
      ? selectedVariant.title
      : null;
  const price = selectedVariant?.price;
  const compareAt = selectedVariant?.compareAtPrice;
  const onSale = Boolean(price && compareAt && Number(compareAt.amount) > Number(price.amount));

  return (
    // keyed so gallery, quantity and accordion state reset when moving between products
    <section key={product.id} className="sf-section sf-pdp-page">
      <div className="sf-wrap">
        <Breadcrumbs title={title} />
        <div className="sf-pdp">
          <ProductGallery
            images={product.images.nodes}
            title={title}
            tone={toneVar(product.tone?.value)}
            activeImageId={selectedVariant?.image?.id}
          />
          <div className="sf-info">
            {typeLabel ? (
              <div className="sf-row" style={{gap: 8}}>
                <Badge tone={toBadgeTone(product.badgeTone?.value)} size="lg">
                  {typeLabel}
                </Badge>
              </div>
            ) : null}
            <h1 className="sbm-product-title sf-pdp__title">{title}</h1>
            {claim ? <p className="sf-pdp__claim">{claim}</p> : null}
            {descriptionHtml ? (
              <div className="sbm-body sf-pdp__desc" dangerouslySetInnerHTML={{__html: descriptionHtml}} />
            ) : null}
            <div className="sf-price">
              {formatPrice(price)}
              {onSale ? (
                <s className="sbm-caption">
                  <span className="sr-only">Was </span>
                  {formatPrice(compareAt)}
                </s>
              ) : null}
              {size ? <span className="sbm-caption">{size}</span> : null}
            </div>
            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              toastMessage={[title, optionLabel, size].filter(Boolean).join(' · ')}
            />
            <ClaimBadges badges={parseListMetafield(product.claimBadges?.value)} />
            <Checklist items={parseListMetafield(product.checklist?.value)} />
            <ProductDetails
              inside={product.inside?.value}
              ingredients={product.ingredients?.value}
              directions={product.directions?.value}
            />
          </div>
        </div>
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

// Design copy lives in `custom.*` product metafields (Shopify admin → Products → Metafields).
const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 20) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
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
    tone: metafield(namespace: "custom", key: "tone") {
      value
    }
    claimBadges: metafield(namespace: "custom", key: "claim_badges") {
      value
    }
    checklist: metafield(namespace: "custom", key: "checklist") {
      value
    }
    inside: metafield(namespace: "custom", key: "inside") {
      value
    }
    ingredients: metafield(namespace: "custom", key: "ingredients") {
      value
    }
    directions: metafield(namespace: "custom", key: "directions") {
      value
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
