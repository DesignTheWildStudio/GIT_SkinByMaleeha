import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';
import {Button, Input} from '~/components/sbm/Controls';
import {FormMessage} from '~/components/sbm/FormFields';
import {PageSectionHead} from '~/components/sbm/PageHeader';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Profile | skinbymaleeha'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;
  const saving = state !== 'idle';

  return (
    <div className="sf-account__profile">
      <PageSectionHead title="Profile" />
      <div className="sbm-card sf-box sf-formcard">
        <Form method="PUT">
          <fieldset className="sf-fieldset">
            <legend className="sf-formhead">
              <span className="sbm-label">Personal information</span>
              <span className="sbm-caption">
                Your name as it appears on orders and deliveries.
              </span>
            </legend>
            <div className="sf-form sf-form--stack">
              <Input
                label="First name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                defaultValue={customer.firstName ?? ''}
                minLength={2}
              />
              <Input
                label="Last name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                defaultValue={customer.lastName ?? ''}
                minLength={2}
              />
              {action?.error ? (
                <FormMessage className="full">{action.error}</FormMessage>
              ) : action?.customer && !saving ? (
                <FormMessage tone="success" className="full">
                  Your details have been saved.
                </FormMessage>
              ) : null}
              <div className="sf-form__actions full">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          </fieldset>
        </Form>
      </div>
    </div>
  );
}
