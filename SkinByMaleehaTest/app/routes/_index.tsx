import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import heroImage from '~/assets/sbm/imagery/packaging-lifestyle.jpg';
import featureImage from '~/assets/sbm/imagery/texture-bubbles-blue.jpg';
import {SBM_PRODUCT_CARD_FRAGMENT, toCardProduct} from '~/lib/sbm-product';
import {Emblem, InfoBadge, Lockup, Signature} from '~/components/sbm/Brand';
import {Button} from '~/components/sbm/Controls';
import {FeatureCard, ProductCard} from '~/components/sbm/ProductCard';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'skinbymaleeha | Formulated by a dermatologist'},
    {
      name: 'description',
      content:
        'Science perfected for skin that naturally thrives daily. Mindfully formulated skincare by Dr Maleeha Jawaid.',
    },
  ];
};

export const links: Route.LinksFunction = () => [
  {rel: 'preload', as: 'image', href: heroImage},
];

export async function loader({context}: Route.LoaderArgs) {
  const {range, centella} = await context.storefront.query(HOME_QUERY, {
    variables: {rangeHandle: 'the-range', featureHandle: 'centella-moisturiser'},
  });
  return {
    products: (range?.products.nodes ?? []).map(toCardProduct),
    centella: centella ? toCardProduct(centella) : null,
  };
}

const CLAIMS = ['24h', 'spf50', 'all-skin', 'ph', 'glow'] as const;

export default function Homepage() {
  const {products, centella} = useLoaderData<typeof loader>();
  return (
    <>
      <section className="sf-hero">
        <div className="sf-hero__copy">
          <p className="sbm-eyebrow">Formulated by a dermatologist</p>
          <h1 className="sbm-display-m" style={{maxWidth: '13ch'}}>
            Science perfected for skin that <em>naturally thrives daily</em>
          </h1>
          <p className="sbm-lede" style={{maxWidth: 460, color: 'var(--fg-2)'}}>
            Mindfully formulated for skin that feels beautifully balanced. Gentle dermatologist
            care for visibly healthy, radiant skin daily.
          </p>
          <div className="sf-row" style={{gap: 28}}>
            <Button size="lg" to="/collections/all">
              Shop the range
            </Button>
            <Button variant="link" iconRight="arrow-right" to="#founder">
              Meet Dr Maleeha
            </Button>
          </div>
        </div>
        <div className="sf-hero__img" style={{backgroundImage: `url(${heroImage})`}} />
      </section>

      <section className="sf-claims">
        <div className="sf-claims__in">
          <div className="sf-claims__badges">
            {CLAIMS.map((t) => (
              <InfoBadge key={t} type={t} tone="serum" size={84} />
            ))}
          </div>
          <Lockup type="claims" height={40} />
        </div>
      </section>

      <section className="sf-section">
        <div className="sf-wrap">
          <div className="sf-head-row">
            <h2 className="sbm-h1">
              The <em>range</em>
            </h2>
            <Button variant="link" iconRight="arrow-right" to="/collections/all">
              Shop all
            </Button>
          </div>
          <div className="sf-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="sf-banner">
        <div className="sf-wrap sf-banner__in">
          <h2
            className="sbm-sans-headline"
            style={{fontSize: 'clamp(40px, 5.6vw, 80px)', maxWidth: '16ch'}}
          >
            Barrier repair, clinically calm moisturiser cream for you
          </h2>
          <Button variant="white" size="lg" to="/products/centella-moisturiser">
            Discover
          </Button>
        </div>
      </section>

      {centella ? (
        <section className="sf-feature">
          <div className="sf-feature__img" style={{backgroundImage: `url(${featureImage})`}} />
          <div className="sf-feature__card">
            <FeatureCard
              elevated
              style={{width: 'min(100%, 380px)'}}
              title={
                <span>
                  The <em>Centella</em> Collection
                </span>
              }
              description={centella.description}
              product={centella}
            />
          </div>
        </section>
      ) : null}

      <section className="sf-founder" id="founder">
        <div className="sf-founder__in">
          <Emblem size={44} />
          <p className="sbm-eyebrow">From the dermatologist</p>
          <p
            className="sbm-h2"
            style={{textTransform: 'none', letterSpacing: '.01em', lineHeight: 1.2}}
          >
            “Formulated with dermatologists for all skin types, ensuring{' '}
            <em>optimal hydration</em> and maximum protection.”
          </p>
          <Signature width={230} />
          <p className="sbm-caption">Dr. Maleeha Jawaid · Consultant Dermatologist</p>
        </div>
      </section>
    </>
  );
}

const HOME_QUERY = `#graphql
  query SbmHome(
    $country: CountryCode
    $language: LanguageCode
    $rangeHandle: String!
    $featureHandle: String!
  ) @inContext(country: $country, language: $language) {
    range: collection(handle: $rangeHandle) {
      products(first: 8) {
        nodes {
          ...SbmProductCard
        }
      }
    }
    centella: product(handle: $featureHandle) {
      ...SbmProductCard
    }
  }
  ${SBM_PRODUCT_CARD_FRAGMENT}
` as const;
