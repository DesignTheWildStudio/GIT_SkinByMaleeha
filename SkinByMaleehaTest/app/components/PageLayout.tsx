import type {CartApiQueryFragment, SbmFooterQuery} from 'storefrontapi.generated';
import {SiteFrame} from '~/components/sbm/Layout';
import {BagDrawer, BagProvider, BagToast} from '~/components/sbm/Bag';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<SbmFooterQuery | null>;
  children?: React.ReactNode;
}

export function PageLayout({cart, children = null, footer}: PageLayoutProps) {
  return (
    <BagProvider>
      <SiteFrame cart={cart} footer={footer}>
        {children}
      </SiteFrame>
      <BagDrawer cart={cart} />
      <BagToast />
    </BagProvider>
  );
}
