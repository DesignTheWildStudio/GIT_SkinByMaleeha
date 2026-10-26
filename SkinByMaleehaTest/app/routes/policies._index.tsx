import {useLoaderData} from 'react-router';
import type {Route} from './+types/policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';
import {PageLinkList} from '~/components/sbm/PageHeader';
import {PageError} from '~/components/sbm/PageError';
import styles from '~/styles/sbm-pages.css?url';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Policies | skinbymaleeha'}];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap sf-doc">
        <header className="sf-doc__head">
          <p className="sbm-eyebrow">Help</p>
          <h1 className="sbm-display-m">
            Our <em>policies</em>
          </h1>
          <p className="sbm-body sf-pagehead__lede">
            How we look after your orders, your deliveries and your information.
          </p>
        </header>
        <div className="sf-doc__body">
          <PageLinkList
            items={policies.map((policy) => ({
              id: policy.id,
              to: `/policies/${policy.handle}`,
              label: policy.title,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
