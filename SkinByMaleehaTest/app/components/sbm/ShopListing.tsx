import type {ComponentProps, ReactNode} from 'react';
import {useLocation, useNavigate, useNavigation} from 'react-router';
import type {Pagination} from '@shopify/hydrogen';
import type {SbmProductCardFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {toCardProduct} from '~/lib/sbm-product';
import {
  SORT_OPTIONS,
  findCategory,
  parseShopParams,
  shopSearch,
  type ShopParams,
  type ShopSort,
} from '~/lib/sbm-shop';
import {Button} from './Controls';
import {ProductCard} from './ProductCard';
import {Select, Tag} from './Filters';

export type ProductConnection = ComponentProps<
  typeof Pagination<SbmProductCardFragment>
>['connection'];

/** The design's Shop page: eyebrow, display title + intro, sort select, category chips, product grid. */
export function ShopListing({
  eyebrow,
  title,
  intro,
  categories,
  params,
  products,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  categories: string[];
  params: ShopParams;
  products: ProductConnection;
}) {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  // While a chip or sort is loading, show it as already selected.
  const pending =
    navigation.location?.pathname === pathname
      ? parseShopParams(new URLSearchParams(navigation.location.search))
      : null;
  const current = pending ?? params;
  const selected = findCategory(categories, current.category);
  const href = (next: ShopParams) => pathname + shopSearch(next);

  return (
    <section className="sf-section sbm-shop">
      <div className="sf-wrap">
        <p className="sbm-eyebrow sbm-shop__eyebrow">{eyebrow}</p>
        <div className="sf-head-row">
          <div className="sbm-shop__intro">
            <h1 className="sbm-display-m">{title}</h1>
            {intro ? <p className="sbm-body">{intro}</p> : null}
          </div>
          <Select
            label="Sort by"
            className="sbm-shop__sort"
            value={current.sort}
            options={SORT_OPTIONS}
            onChange={(event) => {
              void navigate(href({...current, sort: event.target.value as ShopSort}), {
                preventScrollReset: true,
              });
            }}
          />
        </div>
        <PaginatedResourceSection<SbmProductCardFragment>
          connection={products}
          resourcesClassName="sf-grid"
          header={({nodes}) => (
            <div className="sf-row sbm-shop__filters">
              <Tag to={href({...current, category: null})} selected={!current.category}>
                All
              </Tag>
              {categories.map((c) => (
                <Tag key={c} to={href({...current, category: c})} selected={c === selected}>
                  {c}
                </Tag>
              ))}
              <span className="sbm-caption sbm-shop__count" aria-live="polite">
                {nodes.length} {nodes.length === 1 ? 'product' : 'products'}
              </span>
            </div>
          )}
          empty={
            <div className="sbm-shop__empty">
              <p className="sbm-body">
                {current.category
                  ? `Nothing in ${selected ?? current.category} here yet.`
                  : 'Nothing here yet — new formulas are on their way.'}
              </p>
              <Button
                variant="outline"
                to={current.category ? href({...current, category: null}) : '/collections/all'}
              >
                {current.category ? 'View all' : 'Shop all skincare'}
              </Button>
            </div>
          }
        >
          {({node, index}) => (
            <ProductCard
              key={node.id}
              product={toCardProduct(node)}
              loading={index < 8 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      </div>
    </section>
  );
}

/** Title with one word in the italic accent (see accentTitle). */
export function AccentTitle({parts}: {parts: [string, string, string]}) {
  const [before, accent, after] = parts;
  return (
    <>
      {before}
      <em>{accent}</em>
      {after}
    </>
  );
}
