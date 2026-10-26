import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle._index';
import {Image, getPaginationVariables} from '@shopify/hydrogen';
import type {ArticleItemFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Emblem} from '~/components/sbm/Brand';
import {Button} from '~/components/sbm/Controls';
import {PageEmpty, PageHeader, accentTitle, formatDate} from '~/components/sbm/PageHeader';
import {PageError} from '~/components/sbm/PageError';
import styles from '~/styles/sbm-pages.css?url';

export const meta: Route.MetaFunction = ({data}) => {
  const blog = data?.blog;
  if (!blog) return [{title: 'Page not found | skinbymaleeha'}];
  const description = blog.seo?.description;
  return [
    {title: `${blog.seo?.title || blog.title} | skinbymaleeha`},
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
  // two full rows of the three-up article grid
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 6,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  return {blog};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const {blog} = useLoaderData<typeof loader>();
  const {articles} = blog;

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap">
        <PageHeader
          crumbs={[{label: 'Journal', to: '/blogs'}, {label: blog.title}]}
          eyebrow="Journal"
          title={accentTitle(blog.title)}
          lede={blog.seo?.description || undefined}
        />
        <PaginatedResourceSection<ArticleItemFragment>
          connection={articles}
          resourcesClassName="sf-articles"
          empty={
            <PageEmpty
              title="No stories yet."
              actions={<Button to="/collections/all">Shop all skincare</Button>}
            >
              Skincare notes from Dr Maleeha are on their way — check back soon.
            </PageEmpty>
          }
        >
          {({node: article, index}) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 3 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </section>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const to = `/blogs/${article.blog.handle}/${article.handle}`;
  return (
    <article className="sf-acard">
      <Link to={to} prefetch="intent" className="sf-acard__media" aria-label={article.title}>
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="3/2"
            data={article.image}
            loading={loading}
            sizes="(min-width: 961px) 33vw, (min-width: 601px) 50vw, 100vw"
          />
        ) : (
          <Emblem size={44} alt="" />
        )}
      </Link>
      <p className="sbm-eyebrow sf-acard__date">
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      </p>
      <h2 className="sf-acard__title">
        <Link to={to} prefetch="intent">
          {article.title}
        </Link>
      </h2>
      {article.excerpt ? <p className="sf-acard__excerpt">{article.excerpt}</p> : null}
      <Button variant="link" iconRight="arrow-right" to={to}>
        Read more
      </Button>
    </article>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
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
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    excerpt
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;
