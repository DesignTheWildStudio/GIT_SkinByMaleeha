import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
};

/**
 * <PaginatedResourceSection> encapsulates the previous and next pagination behaviors throughout your application.
 * `header` renders above the list with the nodes loaded so far (e.g. a result count);
 * `empty` replaces the list when there are no nodes and no pages to load either way.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  ariaLabel,
  resourcesClassName,
  header,
  empty,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  ariaLabel?: string;
  resourcesClassName?: string;
  header?: (props: {nodes: NodesType[]}) => React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink, hasPreviousPage, hasNextPage}) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div>
            {header ? header({nodes}) : null}
            {hasPreviousPage ? (
              <div style={{...navStyle, marginBottom: 44}}>
                <PreviousLink className="sbm-btn sbm-btn--outline">
                  {isLoading ? (
                    'Loading…'
                  ) : (
                    <span>
                      <span aria-hidden="true">↑</span> Load previous
                    </span>
                  )}
                </PreviousLink>
              </div>
            ) : null}
            {nodes.length === 0 && !hasPreviousPage && !hasNextPage && empty ? (
              empty
            ) : resourcesClassName ? (
              <div
                aria-label={ariaLabel}
                className={resourcesClassName}
                role={ariaLabel ? 'region' : undefined}
              >
                {resourcesMarkup}
              </div>
            ) : (
              resourcesMarkup
            )}
            {hasNextPage ? (
              <div style={{...navStyle, marginTop: 56}}>
                <NextLink className="sbm-btn sbm-btn--outline">
                  {isLoading ? (
                    'Loading…'
                  ) : (
                    <span>
                      Load more <span aria-hidden="true">↓</span>
                    </span>
                  )}
                </NextLink>
              </div>
            ) : null}
          </div>
        );
      }}
    </Pagination>
  );
}
