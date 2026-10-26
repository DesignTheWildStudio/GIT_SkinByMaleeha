import {useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle.$articleHandle';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Button} from '~/components/sbm/Controls';
import {PageCrumbs, RichText, accentTitle, formatDate} from '~/components/sbm/PageHeader';
import {PageError} from '~/components/sbm/PageError';
import styles from '~/styles/sbm-pages.css?url';

export const meta: Route.MetaFunction = ({data}) => {
  const article = data?.article;
  if (!article) return [{title: 'Page not found | skinbymaleeha'}];
  const description = article.seo?.description;
  return [
    {title: `${article.seo?.title || article.title} | skinbymaleeha`},
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
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article, blog: {handle: blog.handle, title: blog.title}};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article, blog} = useLoaderData<typeof loader>();
  const {title, image, contentHtml, author} = article;
  const blogUrl = `/blogs/${blog.handle}`;

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap">
        <div className="sf-doc">
          <header className="sf-doc__head">
            <PageCrumbs
              items={[
                {label: 'Journal', to: '/blogs'},
                {label: blog.title, to: blogUrl},
                {label: title},
              ]}
            />
            <p className="sbm-eyebrow">
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </p>
            <h1 className="sbm-h1">{accentTitle(title)}</h1>
            {author?.name ? (
              <p className="sf-doc__meta">
                <span>By {author.name}</span>
              </p>
            ) : null}
            <Button variant="link" iconLeft="arrow-left" to={blogUrl}>
              Back to {blog.title}
            </Button>
          </header>
          <div className="sf-doc__body">
            {image ? (
              <div className="sf-article__hero">
                <Image
                  data={image}
                  alt={image.altText || title}
                  aspectRatio="16/9"
                  sizes="(min-width: 961px) 680px, 100vw"
                  loading="eager"
                />
              </div>
            ) : null}
            <RichText html={contentHtml} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
