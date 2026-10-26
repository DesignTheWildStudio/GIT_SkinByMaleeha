import {useId, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import type {MappedProductOptions} from '@shopify/hydrogen';
import type {ProductFragment} from 'storefrontapi.generated';
import {AddToBagButton} from './sbm/Bag';
import {Button, QuantityStepper, QuantityStepperButton} from './sbm/Controls';
import {Tag} from './sbm/ProductDetail';

const MAX_QUANTITY = 10;

/** Variant option chips (only for real variants), quantity stepper and the full-width "Add to bag". */
export function ProductForm({
  productOptions,
  selectedVariant,
  toastMessage,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  toastMessage: string;
}) {
  const [quantity, setQuantity] = useState(1);
  return (
    <>
      {productOptions.map((option) =>
        // "Default Title" products (a single value) show no picker
        option.optionValues.length > 1 ? <ProductOption key={option.name} option={option} /> : null,
      )}
      <div className="sf-row sf-buy">
        <QuantityStepper
          value={quantity}
          decrease={
            <QuantityStepperButton
              direction="decrease"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            />
          }
          increase={
            <QuantityStepperButton
              direction="increase"
              disabled={quantity >= MAX_QUANTITY}
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            />
          }
        />
        {selectedVariant ? (
          <AddToBagButton
            variantId={selectedVariant.id}
            available={selectedVariant.availableForSale}
            quantity={quantity}
            variant="primary"
            size="lg"
            block
            toastMessage={toastMessage}
          />
        ) : (
          <Button size="lg" block disabled>
            Unavailable
          </Button>
        )}
      </div>
    </>
  );
}

function ProductOption({option}: {option: MappedProductOptions}) {
  const navigate = useNavigate();
  const labelId = useId();
  return (
    <div className="sf-option" role="group" aria-labelledby={labelId}>
      <p id={labelId} className="sbm-label">
        {option.name}
      </p>
      <div className="sf-row sf-option__values">
        {option.optionValues.map((value) => {
          const {name, handle, variantUriQuery, selected, available, exists, isDifferentProduct, swatch} =
            value;
          const content = (
            <>
              <OptionSwatch color={swatch?.color} image={swatch?.image?.previewImage?.url} />
              {name}
            </>
          );
          const unavailable = available ? '' : 'is-unavailable';
          if (isDifferentProduct) {
            // Combined-listing child products are real links (crawlable)
            return (
              <Link
                key={option.name + name}
                className={['sbm-tag', selected ? 'sbm-tag--selected' : '', unavailable]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={selected || undefined}
                prefetch="intent"
                preventScrollReset
                replace
                to={`/products/${handle}?${variantUriQuery}`}
              >
                {content}
              </Link>
            );
          }
          // Same-product variants update the search param without creating indexable links
          return (
            <Tag
              key={option.name + name}
              selected={selected}
              disabled={!exists}
              className={unavailable}
              onClick={() => {
                if (!selected) {
                  void navigate(`?${variantUriQuery}`, {replace: true, preventScrollReset: true});
                }
              }}
            >
              {content}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

function OptionSwatch({color, image}: {color?: string | null; image?: string | null}) {
  if (!color && !image) return null;
  return (
    <span
      className="sf-option__swatch"
      aria-hidden="true"
      style={{
        backgroundColor: color || undefined,
        backgroundImage: image ? `url(${image})` : undefined,
      }}
    />
  );
}
