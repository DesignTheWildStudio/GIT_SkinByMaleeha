import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {Await, Link, type FetcherWithComponents} from 'react-router';
import {CartForm, Image, useOptimisticCart, type OptimisticCartLine} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {formatPrice, toneVar, type MoneyLike} from '~/lib/sbm-product';
import {
  Button,
  Drawer,
  IconButton,
  QuantityStepper,
  QuantityStepperButton,
  Toast,
} from './Controls';

type ToastState = {
  tone?: 'success' | 'error';
  title: string;
  message?: string;
} | null;

type BagContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toast: ToastState;
  notify: (toast: NonNullable<ToastState>) => void;
  dismissToast: () => void;
};

const BagContext = createContext<BagContextValue | null>(null);

/** Bag drawer + "Added to your bag" toast state, shared by the header, cards and product page. */
export function BagProvider({children}: {children: ReactNode}) {
  const [isOpen, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);
  const notify = useCallback((next: NonNullable<ToastState>) => {
    setToast(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);
  const open = useCallback(() => {
    dismissToast();
    setOpen(true);
  }, [dismissToast]);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(
    () => ({isOpen, open, close, toast, notify, dismissToast}),
    [isOpen, open, close, toast, notify, dismissToast],
  );
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const bag = useContext(BagContext);
  if (!bag) throw new Error('useBag must be used within a BagProvider');
  return bag;
}

/** Fixed toast at the bottom of the viewport. */
export function BagToast() {
  const {toast, dismissToast, open} = useBag();
  if (!toast) return null;
  return (
    <div className="sf-toast">
      <Toast
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
        action={toast.tone === 'error' ? undefined : 'View bag'}
        onAction={open}
        onClose={dismissToast}
      />
    </div>
  );
}

type AddToBagProps = {
  variantId?: string;
  available?: boolean;
  quantity?: number;
  /** Product name + pack size for the toast, e.g. "Daily Moisturiser · 50 ml". */
  toastMessage: string;
  label?: string;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
};

/** Pill button that adds a variant to the Shopify cart and confirms with the toast. */
export function AddToBagButton({
  variantId,
  available = true,
  quantity = 1,
  ...props
}: AddToBagProps) {
  if (!variantId) return null;
  return (
    <CartForm
      route="/cart"
      inputs={{lines: [{merchandiseId: variantId, quantity}]}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => (
        <AddToBagSubmit fetcher={fetcher} available={available} {...props} />
      )}
    </CartForm>
  );
}

function AddToBagSubmit({
  fetcher,
  available,
  toastMessage,
  label = 'Add to bag',
  variant = 'outline',
  size = 'sm',
  block = false,
}: Omit<AddToBagProps, 'variantId'> & {fetcher: FetcherWithComponents<any>}) {
  const {notify} = useBag();
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (fetcher.state !== 'idle') {
      wasSubmitting.current = true;
      return;
    }
    if (!wasSubmitting.current) return;
    wasSubmitting.current = false;
    const errors = (fetcher.data as {errors?: Array<{message: string}>} | undefined)?.errors;
    if (errors?.length) {
      notify({tone: 'error', title: 'Could not add to your bag', message: errors[0].message});
    } else {
      notify({title: 'Added to your bag', message: toastMessage});
    }
  }, [fetcher.state, fetcher.data, notify, toastMessage]);

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      block={block}
      disabled={!available || fetcher.state !== 'idle'}
    >
      {available ? label : 'Sold out'}
    </Button>
  );
}

type BagLine = OptimisticCartLine<CartApiQueryFragment>;

/** Bag icon in the header with the live item count. */
export function BagIconButton({cart}: {cart: Promise<CartApiQueryFragment | null>}) {
  const {open} = useBag();
  return (
    <Suspense fallback={<IconButton icon="shopping-bag" label="Bag" onClick={open} />}>
      <Await resolve={cart}>
        {(resolved) => <BagCount cart={resolved} onClick={open} />}
      </Await>
    </Suspense>
  );
}

function BagCount({cart, onClick}: {cart: CartApiQueryFragment | null; onClick: () => void}) {
  const optimistic = useOptimisticCart(cart);
  return (
    <IconButton
      icon="shopping-bag"
      label="Bag"
      count={optimistic?.totalQuantity ?? 0}
      onClick={onClick}
    />
  );
}

/** Right-hand bag drawer. */
export function BagDrawer({cart}: {cart: Promise<CartApiQueryFragment | null>}) {
  const {isOpen, close} = useBag();
  if (!isOpen) return null;
  return (
    <Suspense fallback={<Drawer open onClose={close} title="Your bag" />}>
      <Await resolve={cart}>
        {(resolved) => <BagDrawerContent cart={resolved} onClose={close} />}
      </Await>
    </Suspense>
  );
}

function BagDrawerContent({
  cart: originalCart,
  onClose,
}: {
  cart: CartApiQueryFragment | null;
  onClose: () => void;
}) {
  const cart = useOptimisticCart(originalCart);
  const lines = cart?.lines?.nodes ?? [];
  const count = cart?.totalQuantity ?? 0;
  return (
    <Drawer
      open
      onClose={onClose}
      title={`Your bag (${count})`}
      footer={lines.length ? <BagSummary cart={cart} /> : null}
    >
      {lines.length === 0 ? (
        <BagEmpty onContinue={onClose} />
      ) : (
        <BagLines lines={lines} onNavigate={onClose} />
      )}
    </Drawer>
  );
}

export function BagEmpty({onContinue}: {onContinue?: () => void}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, paddingTop: 12}}>
      <p className="sbm-body">Your bag is empty.</p>
      {onContinue ? (
        <Button variant="outline" onClick={onContinue}>
          Continue shopping
        </Button>
      ) : (
        <Button variant="outline" to="/collections/all">
          Continue shopping
        </Button>
      )}
    </div>
  );
}

/** Subtotal, delivery note and the Shopify checkout button. */
export function BagSummary({
  cart,
}: {
  cart: {checkoutUrl?: string; cost?: {subtotalAmount?: MoneyLike}} | null | undefined;
}) {
  if (!cart) return null;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
      <div className="sf-sum" style={{fontWeight: 500}}>
        <span>Subtotal</span>
        <span>{formatPrice(cart.cost?.subtotalAmount)}</span>
      </div>
      <p className="sbm-caption" style={{margin: 0}}>
        Delivery calculated at checkout.
      </p>
      <Button block size="lg" href={cart.checkoutUrl} disabled={!cart.checkoutUrl}>
        Checkout
      </Button>
    </div>
  );
}

/** Bag line items — used by the drawer and the /cart page. */
export function BagLines({lines, onNavigate}: {lines: BagLine[]; onNavigate?: () => void}) {
  return (
    <div>
      {lines.map((line) => (
        <BagLineItem key={line.id} line={line} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function BagLineItem({line, onNavigate}: {line: BagLine; onNavigate?: () => void}) {
  const {merchandise, quantity, isOptimistic} = line;
  const product = merchandise.product;
  const to = `/products/${product.handle}`;
  const size = product.size?.value;
  const optionLabel = merchandise.title !== 'Default Title' ? merchandise.title : null;
  return (
    <div className="sf-line">
      <Link
        to={to}
        onClick={onNavigate}
        className="sf-line__img"
        style={{backgroundColor: toneVar(product.tone?.value)}}
        aria-label={product.title}
      >
        {merchandise.image ? (
          <Image data={merchandise.image} alt="" sizes="72px" aspectRatio="4/5" crop="center" />
        ) : null}
      </Link>
      <div>
        <p className="sf-line__name">
          <Link to={to} onClick={onNavigate}>
            {product.title}
          </Link>
        </p>
        <p className="sbm-caption" style={{marginBottom: 12}}>
          {[optionLabel, size].filter(Boolean).join(' · ')}
        </p>
        <QuantityStepper
          size="sm"
          value={quantity}
          decrease={
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: Math.max(0, quantity - 1)}]}}
            >
              <QuantityStepperButton
                type="submit"
                direction="decrease"
                disabled={quantity <= 1 || !!isOptimistic}
              />
            </CartForm>
          }
          increase={
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{lines: [{id: line.id, quantity: quantity + 1}]}}
            >
              <QuantityStepperButton
                type="submit"
                direction="increase"
                disabled={quantity >= 10 || !!isOptimistic}
              />
            </CartForm>
          }
        />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 18}}>
        <span style={{font: '500 15px/1 var(--font-body)'}}>{formatPrice(line.cost?.totalAmount)}</span>
        <CartForm route="/cart" action={CartForm.ACTIONS.LinesRemove} inputs={{lineIds: [line.id]}}>
          <IconButton
            type="submit"
            icon="trash-2"
            label={`Remove ${product.title}`}
            size="sm"
            disabled={!!isOptimistic}
          />
        </CartForm>
      </div>
    </div>
  );
}
