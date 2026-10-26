import {useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {type Shop} from '@shopify/hydrogen/storefront-api-types';
import {Button} from '~/components/sbm/Controls';
import {PageCrumbs, RichText, accentTitle} from '~/components/sbm/PageHeader';
import {PageError} from '~/components/sbm/PageError';
import styles from '~/styles/sbm-pages.css?url';

type SelectedPolicies = keyof Pick<
  Shop,
  'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
>;

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: data?.policy ? `${data.policy.title} | skinbymaleeha` : 'Policy | skinbymaleeha'},
  ];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response('No handle was passed in', {status: 404});
  }

  const policyName = params.handle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as SelectedPolicies;

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Could not find the policy', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap sf-doc">
        <header className="sf-doc__head">
          <PageCrumbs items={[{label: 'Policies', to: '/policies'}, {label: policy.title}]} />
          <p className="sbm-eyebrow">Policy</p>
          <h1 className="sbm-display-m">{accentTitle(policy.title)}</h1>
          <Button variant="link" iconLeft="arrow-left" to="/policies">
            All policies
          </Button>
        </header>
        <div className="sf-doc__body">
          <RichText html={policy.body} />
        </div>
      </div>
    </section>
  );
}

export function ErrorBoundary() {
  return <PageError />;
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
