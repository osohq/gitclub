import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps } from '@reach/router';

import { NotifyContext, UserContext } from '../App';
import { user as userApi } from '../api';

export function Login(_: RouteComponentProps) {
  const user = useContext(UserContext);
  const notify = useContext(NotifyContext);
  const [email, setEmail] = useState<string>('');

  // If a logged-in user navigates to this page, redirect to home.
  if (user.loggedIn()) return <Redirect to="/" noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const u = await userApi.login({ user: email });
      user.update(u);
    } catch (e) {
      notify.error('Failed to log in.');
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setEmail(value);
  }

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          e-mail: <input type="text" value={email} onChange={handleChange} />
        </label>{' '}
        <input
          type="submit"
          value="Log in"
          disabled={!email.replaceAll(' ', '')}
        />
      </form>
    </>
  );
}
