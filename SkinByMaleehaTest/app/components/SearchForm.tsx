import {useRef, useEffect, useId} from 'react';
import {Form, type FormProps} from 'react-router';
import {Button} from '~/components/sbm/Controls';
import {Icon} from '~/components/sbm/Icon';

type SearchFormProps = Omit<FormProps, 'children' | 'method'> & {
  /** Current search term, shown in the field. */
  defaultValue?: string;
  placeholder?: string;
};

/**
 * Search form that sends GET requests to the `/search` route: the design's pill
 * field with a search icon, plus a submit button. ⌘K focuses the field.
 */
export function SearchForm({
  defaultValue = '',
  placeholder = 'Search moisturisers, SPF, ingredients…',
  action = '/search',
  className = '',
  ...props
}: SearchFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const id = useId();

  useFocusOnCmdK(inputRef);

  return (
    <Form
      method="get"
      action={action}
      role="search"
      className={['sf-searchform', className].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="sbm-field">
        <label className="sr-only" htmlFor={id}>
          Search
        </label>
        <div className="sbm-field__control">
          <span className="sbm-field__icon">
            <Icon name="search" size={18} />
          </span>
          <input
            // remount when the term changes so the field shows the new search
            key={defaultValue}
            ref={inputRef}
            id={id}
            className="sbm-field__input"
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
      </div>
      <Button type="submit">Search</Button>
    </Form>
  );
}

/**
 * Focuses the input when cmd+k is pressed
 */
function useFocusOnCmdK(inputRef: React.RefObject<HTMLInputElement | null>) {
  // focus the input when cmd+k is pressed
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && event.metaKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === 'Escape') {
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);
}
