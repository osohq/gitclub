import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps } from '@reach/router';

import { SetUserProp, UserContext } from './App';
import { User } from './User';

type LoginProps = RouteComponentProps & SetUserProp;

async function login(email: string): Promise<User | undefined> {
  try {
    const res = await fetch('http://localhost:5000/login', {
      body: JSON.stringify({ user: email }),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (res.status === 200) {
      const details: User = await res.json();
      return new User(details);
    } else {
      console.error('TODO(gj): better error handling -- alert?');
    }
  } catch (e) {
    console.error('wot', e);
  }
}

export function Login({ setUser }: LoginProps) {
  const user = useContext(UserContext);
  const [email, setEmail] = useState<string>('');

  // If a logged-in user navigates to this page, redirect to home.
  if (user !== 'Guest') return <Redirect to="/" noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const user = await login(email);
    if (user) setUser(user);
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
        <input type="submit" value="Log in" />
      </form>
    </>
  );
}
