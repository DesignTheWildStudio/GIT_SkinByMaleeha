import {useLoaderData} from 'react-router';
import type {Route} from './+types/blogs._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import type {BlogsQuery} from 'storefrontapi.generated';
import {Button} from '~/components/sbm/Controls';
import {PageEmpty, PageLinkRow} from '~/components/sbm/PageHeader';
import styles from '~/styles/sbm-pages.css?url';

type BlogNode = BlogsQuery['blogs']['nodes'][0];

export const meta: Route.MetaFunction = () => {
  return [{title: 'Journal | skinbymaleeha'}];
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
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blogs() {
  const {blogs} = useLoaderData<typeof loader>();

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap sf-doc">
        <header className="sf-doc__head">
          <p className="sbm-eyebrow">From the dermatologist</p>
          <h1 className="sbm-display-m">
            The <em>journal</em>
          </h1>
          <p className="sbm-body sf-pagehead__lede">
            Skincare notes, launch news and the thinking behind each formula.
          </p>
        </header>
        <div className="sf-doc__body">
          {blogs.nodes.length ? (
            <PaginatedResourceSection<BlogNode>
              connection={blogs}
              resourcesClassName="sf-linklist"
            >
              {({node: blog}) => (
                <div key={blog.handle}>
                  <PageLinkRow to={`/blogs/${blog.handle}`} label={blog.title} />
                </div>
              )}
            </PaginatedResourceSection>
          ) : (
            <PageEmpty
              title="No stories yet."
              actions={<Button to="/collections/all">Shop all skincare</Button>}
            >
              Skincare notes from Dr Maleeha are on their way.
            </PageEmpty>
          )}
        </div>
      </div>
    </section>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
` as const;
