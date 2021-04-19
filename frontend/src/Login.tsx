import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps } from '@reach/router';

import { SetUserProp, UserContext } from './App';
import { user as userApi } from './api';

type LoginProps = RouteComponentProps & SetUserProp;

export function Login({ setUser }: LoginProps) {
  const user = useContext(UserContext);
  const [email, setEmail] = useState<string>('');

  // If a logged-in user navigates to this page, redirect to home.
  if (user !== 'Guest') return <Redirect to="/" noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const user = await userApi.login({ user: email });
      setUser(user);
    } catch (e) {
      // TODO(gj): flash message?
      console.log(e);
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
