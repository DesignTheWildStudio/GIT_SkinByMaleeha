import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {useEffect, useState} from 'react';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {Badge, Button, Input} from '~/components/sbm/Controls';
import {Checkbox, FormMessage} from '~/components/sbm/FormFields';
import {PageEmpty, PageSectionHead} from '~/components/sbm/PageHeader';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Addresses | skinbymaleeha'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="sf-account__addresses">
      <PageSectionHead title="Addresses" />
      <div className="sf-addresses">
        <div className="sf-addrlist">
          <h3 className="sbm-label">Saved addresses</h3>
          {!addresses.nodes.length ? (
            <PageEmpty title="No saved addresses yet.">
              Add one and it will be ready at checkout.
            </PageEmpty>
          ) : (
            <ExistingAddresses addresses={addresses} defaultAddress={defaultAddress} />
          )}
        </div>
        <div className="sbm-card sf-box">
          <div className="sf-formhead">
            <h3 className="sbm-label">Add an address</h3>
            <span className="sbm-caption">Fields marked * are required.</span>
          </div>
          <NewAddressForm key={addresses.nodes.length} />
        </div>
      </div>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      method="POST"
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <Button disabled={stateForMethod('POST') !== 'idle'} type="submit">
          {stateForMethod('POST') !== 'idle' ? 'Adding…' : 'Add address'}
        </Button>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <>
      {addresses.nodes.map((address) => (
        <ExistingAddress
          key={address.id}
          address={address}
          defaultAddress={defaultAddress}
        />
      ))}
    </>
  );
}

/** Saved address card: the formatted address, then edit (inline form) and remove. */
function ExistingAddress({
  address,
  defaultAddress,
}: {
  address: AddressFragment;
  defaultAddress: CustomerFragment['defaultAddress'];
}) {
  const [editing, setEditing] = useState(false);
  const action = useActionData<ActionResponse>();
  const {state, formMethod, formData} = useNavigation();
  const isDefault = defaultAddress?.id === address.id;
  const pendingHere = state !== 'idle' && formData?.get('addressId') === address.id;
  const removing = pendingHere && formMethod === 'DELETE';
  const error = action?.error?.[address.id];
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ');

  // close the editor once a save has gone through
  useEffect(() => {
    if (action?.updatedAddress && !action.error) setEditing(false);
  }, [action]);

  return (
    <div className="sbm-card sf-box sf-addr">
      <div className="sf-addr__top">
        <p className="sf-addr__name">{name || 'Address'}</p>
        {isDefault ? (
          <Badge tone="centella" size="sm">
            Default
          </Badge>
        ) : null}
      </div>
      {editing ? (
        <AddressForm
          method="PUT"
          addressId={address.id}
          address={address}
          defaultAddress={defaultAddress}
        >
          {({stateForMethod}) => (
            <>
              <Button disabled={stateForMethod('PUT') !== 'idle'} type="submit">
                {stateForMethod('PUT') !== 'idle' ? 'Saving…' : 'Save address'}
              </Button>
              <Button variant="link" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          )}
        </AddressForm>
      ) : (
        <>
          <address className="sf-addr__lines">
            {address.formatted
              // the name is already the card heading
              .filter((line, i) => !(i === 0 && name && line === name))
              .map((line, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <p key={i}>{line}</p>
              ))}
            {address.phoneNumber ? <p>{address.phoneNumber}</p> : null}
          </address>
          {error ? <FormMessage>{error}</FormMessage> : null}
          <div className="sf-addr__actions">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Form method="DELETE">
              <input type="hidden" name="addressId" value={address.id} />
              <Button variant="link" size="sm" type="submit" disabled={removing}>
                {removing ? 'Removing…' : 'Remove'}
              </Button>
            </Form>
          </div>
        </>
      )}
    </div>
  );
}

function AddressForm({
  method,
  addressId,
  address,
  defaultAddress,
  children,
}: {
  method: 'POST' | 'PUT';
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod, formData} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  const pendingHere = formData?.get('addressId') === addressId;
  return (
    <Form method={method}>
      <fieldset className="sf-fieldset">
        <legend className="sr-only">
          {addressId === 'NEW_ADDRESS_ID' ? 'New address' : 'Edit address'}
        </legend>
        <input type="hidden" name="addressId" defaultValue={addressId} />
        <div className="sf-form sf-form--stack">
          <Input
            label="First name*"
            autoComplete="given-name"
            defaultValue={address?.firstName ?? ''}
            name="firstName"
            placeholder="First name"
            required
            type="text"
          />
          <Input
            label="Last name*"
            autoComplete="family-name"
            defaultValue={address?.lastName ?? ''}
            name="lastName"
            placeholder="Last name"
            required
            type="text"
          />
          <Input
            className="full"
            label="Company"
            autoComplete="organization"
            defaultValue={address?.company ?? ''}
            name="company"
            placeholder="Company"
            type="text"
          />
          <Input
            className="full"
            label="Address line 1*"
            autoComplete="address-line1"
            defaultValue={address?.address1 ?? ''}
            name="address1"
            placeholder="House, street"
            required
            type="text"
          />
          <Input
            className="full"
            label="Address line 2"
            autoComplete="address-line2"
            defaultValue={address?.address2 ?? ''}
            name="address2"
            placeholder="Apartment, area"
            type="text"
          />
          <Input
            label="City*"
            autoComplete="address-level2"
            defaultValue={address?.city ?? ''}
            name="city"
            placeholder="City"
            required
            type="text"
          />
          <Input
            label="State / Province*"
            autoComplete="address-level1"
            defaultValue={address?.zoneCode ?? ''}
            name="zoneCode"
            placeholder="State / Province"
            required
            type="text"
          />
          <Input
            label="Postal code*"
            autoComplete="postal-code"
            defaultValue={address?.zip ?? ''}
            name="zip"
            placeholder="Postal code"
            required
            type="text"
          />
          <Input
            label="Country code*"
            autoComplete="country"
            defaultValue={address?.territoryCode ?? ''}
            name="territoryCode"
            placeholder="e.g. PK"
            required
            type="text"
            maxLength={2}
          />
          <Input
            className="full"
            label="Phone"
            autoComplete="tel"
            defaultValue={address?.phoneNumber ?? ''}
            name="phoneNumber"
            placeholder="+923001234567"
            pattern="^\+?[1-9]\d{3,14}$"
            type="tel"
          />
          <Checkbox
            className="full"
            defaultChecked={isDefaultAddress}
            name="defaultAddress"
            label="Set as default address"
          />
          {error ? <FormMessage className="full">{error}</FormMessage> : null}
          <div className="sf-form__actions full">
            {children({
              stateForMethod: (method) =>
                formMethod === method && pendingHere ? state : 'idle',
            })}
          </div>
        </div>
      </fieldset>
    </Form>
  );
}
