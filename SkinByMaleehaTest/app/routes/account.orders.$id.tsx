import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import {Icon} from '~/components/sbm/Icon';
import {
  OrderNumber,
  OrderTracker,
  StatusBadge,
  orderStep,
} from '~/components/sbm/PageAccount';
import {PageCrumbs, formatDate} from '~/components/sbm/PageHeader';
import {PageError} from '~/components/sbm/PageError';
import {formatPrice} from '~/lib/sbm-product';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: data?.order ? `Order ${data.order.name} | skinbymaleeha` : 'Order | skinbymaleeha'},
  ];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? null;

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();
  const hasDiscount = Boolean((discountValue && Number(discountValue.amount)) || discountPercentage);
  const address = order.shippingAddress;

  return (
    <div className="sf-account__order">
      <div className="sf-order__head">
        <PageCrumbs
          items={[
            {label: 'Account', to: '/account'},
            {label: 'Orders', to: '/account/orders'},
            {label: `Order ${order.name}`},
          ]}
        />
        <h2 className="sbm-h2">
          Order{' '}
          <em>
            <OrderNumber value={order.name} />
          </em>
        </h2>
        <p className="sbm-caption">
          Placed on {formatDate(order.processedAt)}
          {order.confirmationNumber ? ` · Confirmation ${order.confirmationNumber}` : ''}
        </p>
      </div>

      <div className="sf-order">
        <div className="sf-order__main">
          <OrderTracker current={orderStep(order.fulfillmentStatus)} />
          <div>
            <h3 className="sbm-label sf-card-label">
              {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
            </h3>
            <div className="sf-order__lines">
              {lineItems.map((lineItem, lineItemIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
              ))}
            </div>
          </div>
        </div>

        <aside className="sf-order__aside">
          <div className="sbm-card sf-box">
            <span className="sbm-label sf-card-label">Summary</span>
            <div className="sf-sum">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {hasDiscount ? (
              <div className="sf-sum">
                <span>Discount</span>
                <span>
                  {discountPercentage
                    ? `−${discountPercentage}%`
                    : `−${formatPrice(discountValue)}`}
                </span>
              </div>
            ) : null}
            <div className="sf-sum">
              <span>Tax</span>
              <span>{formatPrice(order.totalTax)}</span>
            </div>
            <div className="sf-sum sf-sum--total">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            {fulfillmentStatus ? (
              <div className="sf-sum">
                <span>Fulfilment</span>
                <StatusBadge status={fulfillmentStatus} />
              </div>
            ) : null}
            <a
              className="sbm-btn sbm-btn--outline sbm-btn--block sf-order__status"
              href={order.statusPageUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>View order status</span>
              <Icon name="external-link" size={18} />
            </a>
          </div>

          <div className="sbm-card sf-box sf-deliver">
            <span className="sbm-label sf-card-label">Deliver to</span>
            {address ? (
              <address>
                {(address.formatted?.length ? address.formatted : [address.name]).map(
                  (line, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <p key={i}>{line}</p>
                  ),
                )}
              </address>
            ) : (
              <p className="sbm-body">No shipping address on this order.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  const unit = Number(lineItem.price?.amount ?? 0);
  const discount = Number(lineItem.totalDiscount?.amount ?? 0);
  const currencyCode = lineItem.price?.currencyCode;
  const lineTotal = formatPrice({
    amount: String(unit * lineItem.quantity - discount),
    currencyCode,
  });
  const variant =
    lineItem.variantTitle && lineItem.variantTitle !== 'Default Title'
      ? lineItem.variantTitle
      : null;

  return (
    <div className="sf-line">
      <div className="sf-line__img">
        {lineItem.image ? (
          <Image
            data={lineItem.image}
            alt={lineItem.image.altText || lineItem.title}
            sizes="72px"
            aspectRatio="4/5"
            crop="center"
          />
        ) : null}
      </div>
      <div>
        <p className="sf-line__name">{lineItem.title}</p>
        {variant ? <p className="sbm-caption">{variant}</p> : null}
        <p className="sf-order__qty">
          {lineItem.quantity} × {formatPrice(lineItem.price)}
        </p>
      </div>
      <span className="sf-order__linetotal">{lineTotal}</span>
    </div>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}
