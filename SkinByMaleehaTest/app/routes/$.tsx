import type {Route} from './+types/$';
import {PageError} from '~/components/sbm/PageError';
import styles from '~/styles/sbm-pages.css?url';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Page not found | skinbymaleeha'}];
};

export const links: Route.LinksFunction = () => [{rel: 'stylesheet', href: styles}];

export async function loader({request}: Route.LoaderArgs) {
  throw new Response(`${new URL(request.url).pathname} not found`, {
    status: 404,
  });
}

export default function CatchAllPage() {
  return null;
}

/** Renders inside the site frame (header, footer, bag) rather than the bare root boundary. */
export function ErrorBoundary() {
  return <PageError />;
}
