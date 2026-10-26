import {useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Button} from '~/components/sbm/Controls';
import {PageEmpty, RichText, accentTitle} from '~/components/sbm/PageHeader';
import {PageError} from '~/components/sbm/PageError';
import styles from '~/styles/sbm-pages.css?url';

export const meta: Route.MetaFunction = ({data}) => {
  const page = data?.page;
  if (!page) return [{title: 'Page not found | skinbymaleeha'}];
  const description = page.seo?.description;
  return [
    {title: `${page.seo?.title || page.title} | skinbymaleeha`},
    ...(description ? [{name: 'description', content: description}] : []),
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap sf-doc">
        <header className="sf-doc__head">
          <p className="sbm-eyebrow">skinbymaleeha</p>
          <h1 className="sbm-display-m">{accentTitle(page.title)}</h1>
        </header>
        <div className="sf-doc__body">
          {page.body.trim() ? (
            <RichText html={page.body} />
          ) : (
            <PageEmpty
              title="We’re still writing this page."
              actions={
                <>
                  <Button to="/collections/all">Shop all skincare</Button>
                  <Button variant="outline" to="/">
                    Back to home
                  </Button>
                </>
              }
            >
              Check back soon — in the meantime, the full range is a click away.
            </PageEmpty>
          )}
        </div>
      </div>
    </section>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
