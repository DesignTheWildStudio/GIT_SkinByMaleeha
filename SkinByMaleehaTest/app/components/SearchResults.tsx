import {Link} from 'react-router';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {Button} from '~/components/sbm/Controls';
import {PageEmpty, PageLinkList, PageSectionHead} from '~/components/sbm/PageHeader';
import {ProductCard} from '~/components/sbm/ProductCard';
import {toCardProduct} from '~/lib/sbm-product';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';

type SearchItems = RegularSearchReturn['result']['items'];
type SearchProductNode = SearchItems['products']['nodes'][number];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

/** Popular searches offered before a search and after an empty one. */
const SUGGESTIONS = ['Moisturiser', 'SPF', 'Centella', 'Hand wash'];

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return <div className="sf-results">{children({...result.items, term})}</div>;
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;
SearchResults.Suggestions = SearchSuggestions;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <section aria-label="Journal results">
      <PageSectionHead title="Journal" meta={countLabel(articles.nodes.length, 'article')} />
      <PageLinkList
        items={articles.nodes.map((article) => ({
          id: article.id,
          to: urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          }),
          label: article.title,
        }))}
      />
    </section>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <section aria-label="Page results">
      <PageSectionHead title="Pages" meta={countLabel(pages.nodes.length, 'page')} />
      <PageLinkList
        items={pages.nodes.map((page) => ({
          id: page.id,
          to: urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          }),
          label: page.title,
        }))}
      />
    </section>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section aria-label="Product results">
      <PaginatedResourceSection<SearchProductNode>
        connection={products}
        resourcesClassName="sf-grid"
        header={({nodes}) => (
          <PageSectionHead title="Products" meta={countLabel(nodes.length, 'product')} />
        )}
      >
        {({node, index}) => (
          <ProductCard
            key={node.id}
            loading={index < 4 ? 'eager' : 'lazy'}
            product={{
              ...toCardProduct(node),
              to: urlWithTrackingParams({
                baseUrl: `/products/${node.handle}`,
                trackingParams: node.trackingParameters,
                term,
              }),
            }}
          />
        )}
      </PaginatedResourceSection>
    </section>
  );
}

function SearchResultsEmpty({term}: {term: string}) {
  // a quoted search ("spf") shouldn't end up double-quoted
  const shown = term.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
  return (
    <div className="sf-search-empty">
      <PageEmpty
        title={`Nothing matched “${shown}”.`}
        actions={
          <>
            <Button to="/collections/all">Shop all skincare</Button>
            <Button variant="outline" to="/search">
              Clear search
            </Button>
          </>
        }
      >
        Check the spelling, or try a broader word — a product type, an ingredient or a skin
        concern.
      </PageEmpty>
      <SearchSuggestions />
    </div>
  );
}

function SearchSuggestions() {
  return (
    <div className="sf-suggest">
      <p className="sbm-label">Popular searches</p>
      <div className="sf-row">
        {SUGGESTIONS.map((s) => (
          <Link
            key={s}
            className="sbm-tag"
            to={`/search?q=${encodeURIComponent(s)}`}
            prefetch="intent"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}

function countLabel(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
