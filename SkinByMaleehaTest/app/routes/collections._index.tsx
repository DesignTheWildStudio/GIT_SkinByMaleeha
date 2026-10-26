import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import styles from '~/styles/sbm-shop.css?url';
import {accentTitle} from '~/lib/sbm-shop';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {AccentTitle} from '~/components/sbm/ShopListing';
import {Emblem} from '~/components/sbm/Brand';
import {Button} from '~/components/sbm/Controls';

/** Internal collections (homepage merchandising), not shown to shoppers. */
const HIDDEN = new Set(['the-range', 'frontpage']);

/** Brand tints behind collection tiles, in turn. */
const TINTS = [
  'var(--sbm-aloe-dew)',
  'var(--sbm-cloud-mask)',
  'var(--sbm-centella-mist)',
  'var(--sbm-rice-milk)',
];

const INTRO =
  'Explore the range by collection — gentle, effective formulas, each one formulated by a dermatologist.';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Collections | skinbymaleeha'},
    {name: 'description', content: INTRO},
  ];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return {
    collections: {
      ...collections,
      nodes: collections.nodes.filter((c) => !HIDDEN.has(c.handle)),
    },
  };
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <section className="sf-section sbm-shop">
      <div className="sf-wrap">
        <p className="sbm-eyebrow sbm-shop__eyebrow">Shop</p>
        <div className="sf-head-row">
          <div className="sbm-shop__intro">
            <h1 className="sbm-display-m">
              Our <em>collections</em>
            </h1>
            <p className="sbm-body">{INTRO}</p>
          </div>
          <Button variant="link" iconRight="arrow-right" to="/collections/all">
            Shop all skincare
          </Button>
        </div>
        <PaginatedResourceSection<CollectionFragment>
          connection={collections}
          resourcesClassName="sbm-colls"
          empty={
            <div className="sbm-shop__empty">
              <p className="sbm-body">New collections are on their way.</p>
              <Button variant="outline" to="/collections/all">
                Shop all skincare
              </Button>
            </div>
          }
        >
          {({node: collection, index}) => (
            <CollectionTile key={collection.id} collection={collection} index={index} />
          )}
        </PaginatedResourceSection>
      </div>
    </section>
  );
}

function CollectionTile({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  const to = `/collections/${collection.handle}`;
  // Collections without their own image borrow their first product's.
  const image = collection.image ?? collection.products.nodes[0]?.featuredImage;
  return (
    <article className="sbm-coll">
      <Link
        to={to}
        prefetch="intent"
        className="sbm-coll__media"
        style={{background: TINTS[index % TINTS.length]}}
        aria-label={collection.title}
        tabIndex={-1}
      >
        {image ? (
          <Image
            data={image}
            alt={image.altText || collection.title}
            sizes="(min-width: 961px) 33vw, (min-width: 601px) 50vw, 100vw"
            loading={index < 3 ? 'eager' : undefined}
          />
        ) : (
          <Emblem size={56} alt="" />
        )}
      </Link>
      <div className="sbm-coll__body">
        <h2 className="sbm-coll__title">
          <Link to={to} prefetch="intent">
            <AccentTitle parts={accentTitle(collection.title)} />
          </Link>
        </h2>
        {collection.description ? (
          <p className="sbm-coll__desc">{collection.description}</p>
        ) : null}
        <Button variant="link" iconRight="arrow-right" to={to}>
          Shop the collection
        </Button>
      </div>
    </article>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    description
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 1) {
      nodes {
        featuredImage {
          id
          url
          altText
          width
          height
        }
      }
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
