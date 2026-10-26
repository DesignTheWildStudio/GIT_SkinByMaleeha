import {isRouteErrorResponse, useRouteError} from 'react-router';
import {Button} from './Controls';

/**
 * Route-level error boundary. Unlike the root ErrorBoundary it renders inside the
 * site frame, so a missing page keeps the header, footer and bag.
 */
export function PageError() {
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

  return (
    <section className="sf-section sf-pageshell">
      <div className="sf-wrap sf-error">
        <p className="sbm-eyebrow">Error {status}</p>
        <h1 className="sbm-display-m">
          {notFound ? (
            <>
              Page <em>not found</em>
            </>
          ) : (
            <>
              Something <em>went wrong</em>
            </>
          )}
        </h1>
        <p className="sbm-body sf-pagehead__lede">
          {notFound
            ? 'The page you’re looking for may have moved, or the link may be out of date.'
            : message || 'Please try again in a moment.'}
        </p>
        <div className="sf-row sf-error__actions">
          <Button to="/">Back to home</Button>
          <Button variant="outline" to="/collections/all">
            Shop all skincare
          </Button>
        </div>
      </div>
    </section>
  );
}
