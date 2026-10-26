import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {useRef} from 'react';
import {Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {Button, Input} from '~/components/sbm/Controls';
import {OrderNumber, StatusBadge} from '~/components/sbm/PageAccount';
import {PageEmpty, PageSectionHead, formatDate} from '~/components/sbm/PageHeader';
import {formatPrice} from '~/lib/sbm-product';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Orders | skinbymaleeha'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="sf-account__orders">
      <PageSectionHead title="Orders" />
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div aria-live="polite">
      {orders?.nodes.length ? (
        <Pagination connection={orders}>
          {({nodes, isLoading, PreviousLink, NextLink, hasPreviousPage, hasNextPage}) => (
            <>
              {hasPreviousPage ? (
                <div className="sf-pager sf-pager--prev">
                  <PreviousLink className="sbm-btn sbm-btn--outline">
                    {isLoading ? 'Loading…' : 'Load newer orders'}
                  </PreviousLink>
                </div>
              ) : null}
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="is-num">
                      Total
                    </th>
                    <th scope="col">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((order) => (
                    <OrderItem key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
              {hasNextPage ? (
                <div className="sf-pager">
                  <NextLink className="sbm-btn sbm-btn--outline">
                    {isLoading ? 'Loading…' : 'Load older orders'}
                  </NextLink>
                </div>
              ) : null}
            </>
          )}
        </Pagination>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return hasFilters ? (
    <PageEmpty
      title="No orders match your search."
      actions={
        <Button variant="outline" to="/account/orders">
          Clear filters
        </Button>
      }
    >
      Check the order or confirmation number and try again.
    </PageEmpty>
  ) : (
    <PageEmpty
      title="You haven’t placed any orders yet."
      actions={<Button to="/collections/all">Shop all skincare</Button>}
    >
      When you do, they’ll appear here with their delivery status.
    </PageEmpty>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form ref={formRef} onSubmit={handleSubmit} aria-label="Search orders">
      <fieldset className="sf-filter">
        <legend className="sbm-label">Find an order</legend>
        <Input
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order #"
          aria-label="Order number"
          icon="search"
          defaultValue={currentFilters.name || ''}
        />
        <Input
          type="search"
          name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
          placeholder="Confirmation #"
          aria-label="Confirmation number"
          defaultValue={currentFilters.confirmationNumber || ''}
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </Button>
        {hasFilters ? (
          <Button
            variant="link"
            disabled={isSearching}
            onClick={() => {
              setSearchParams(new URLSearchParams());
              formRef.current?.reset();
            }}
          >
            Clear
          </Button>
        ) : null}
      </fieldset>
    </form>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const to = `/account/orders/${btoa(order.id)}`;
  return (
    <tr>
      <td className="sf-table__cell-order">
        <span className="sf-table__order">
          <Link to={to} prefetch="intent">
            <OrderNumber value={order.number} />
          </Link>
        </span>
        <span className="sf-table__sub">
          {formatDate(order.processedAt)}
          {order.confirmationNumber ? ` · ${order.confirmationNumber}` : ''}
        </span>
      </td>
      <td className="sf-table__cell-status">
        <span className="sf-table__badges">
          <StatusBadge status={order.financialStatus} />
          <StatusBadge status={order.fulfillmentStatus} />
        </span>
      </td>
      <td className="sf-table__cell-total is-num">
        <span className="sf-table__total">{formatPrice(order.totalPrice)}</span>
      </td>
      <td className="sf-table__cell-action is-num">
        <Button variant="link" size="sm" iconRight="arrow-right" to={to}>
          View
        </Button>
      </td>
    </tr>
  );
}
