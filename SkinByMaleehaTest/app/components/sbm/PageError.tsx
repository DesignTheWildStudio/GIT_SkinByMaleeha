import type {ReactNode} from 'react';
import {isRouteErrorResponse, useRouteError} from 'react-router';
import {Button} from './Controls';

/**
 * Route-level error boundary. Unlike the root ErrorBoundary it renders inside the
 * site frame, so a missing page keeps the header, footer and bag.
 * `inline` is for a route nested in a layout that already has the page section,
 * wrap and h1 (e.g. inside the account tabs): it renders just the message block.
 */
export function PageError({
  inline = false,
  notFoundCopy = 'The page you’re looking for may have moved, or the link may be out of date.',
  actions,
}: {
  inline?: boolean;
  notFoundCopy?: string;
  actions?: ReactNode;
}) {
  const error = useRouteError();
  let status = 500;
  let message: string | null = null;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    const data: unknown = error.data;
    message =
      typeof data === 'string'
        ? data
        : data && typeof data === 'object' && 'message' in data
          ? String(data.message)
          : null;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const notFound = status === 404;
  const Heading = inline ? 'h2' : 'h1';

  const content = (
    <>
      <p className="sbm-eyebrow">Error {status}</p>
      <Heading className={inline ? 'sbm-h2' : 'sbm-display-m'}>
        {notFound ? (
          <>
            Page <em>not found</em>
          </>
        ) : (
          <>
            Something <em>went wrong</em>
          </>
        )}
      </Heading>
      <p className="sbm-body sf-pagehead__lede">
        {notFound ? notFoundCopy : message || 'Please try again in a moment.'}
      </p>
      <div className="sf-row sf-error__actions">
        {actions ?? (
          <>
            <Button to="/">Back to home</Button>
            <Button variant="outline" to="/collections/all">
              Shop all skincare
            </Button>
          </>
        )}
      </div>
    </>
  );

  if (inline) return <div className="sf-error">{content}</div>;

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap sf-error">{content}</div>
    </section>
  );
}
