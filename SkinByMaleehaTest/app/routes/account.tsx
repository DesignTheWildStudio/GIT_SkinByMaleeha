import {data as remixData, Outlet, useLoaderData} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {AccountNav} from '~/components/sbm/PageAccount';
import {PageError} from '~/components/sbm/PageError';
import {PageHeader} from '~/components/sbm/PageHeader';
import styles from '~/styles/sbm-pages.css?url';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Your account | skinbymaleeha'}];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap">
        <PageHeader
          eyebrow="Your account"
          title={
            customer.firstName ? (
              <>
                Welcome, <em>{customer.firstName}</em>
              </>
            ) : (
              <>
                Your <em>account</em>
              </>
            )
          }
        />
        <AccountNav />
        <Outlet context={{customer}} />
      </div>
    </section>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}
