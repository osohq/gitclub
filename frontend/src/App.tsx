import React, { ChangeEvent, FormEvent, useContext, useState } from 'react';
import {
  Link,
  LinkProps,
  Redirect,
  RouteComponentProps,
  Router,
} from '@reach/router';

import './App.css';

type User = string | null;
const UserContext = React.createContext<User>(null);

const Home = (_: RouteComponentProps) => <h1>GitClub</h1>;

type LoginProps = LogoutProps;

function Login({ setUser }: LoginProps) {
  const user = useContext(UserContext);
  const [email, setEmail] = useState<string>('');

  // If a logged-in user navigates to this page, redirect to home.
  if (user) return <Redirect to="/" noThrow />;

  function handleSubmit(e: FormEvent) {
    if (email.replaceAll(' ', '')) {
      setUser(email);
      setEmail('');
    }
    e.preventDefault();
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

type SetUserProp = { setUser: (user: User) => void };

type LogoutProps = RouteComponentProps & SetUserProp;

const NavLink = (props: React.PropsWithoutRef<LinkProps<{}>>) => (
  <Link
    {...props}
    getProps={({ isCurrent }) => ({
      style: {
        textDecoration: isCurrent ? 'none' : '',
      },
    })}
  />
);

type ParentProps = RouteComponentProps &
  SetUserProp & { children: JSX.Element[] };

function Parent({ children, setUser }: ParentProps) {
  const user = useContext(UserContext);

  function handleLogout(e: React.MouseEvent<HTMLAnchorElement>) {
    setUser(null);
    e.preventDefault();
  }

  return (
    <div>
      <nav>
        <NavLink to="/">Home</NavLink>{' '}
        {!user && <NavLink to="/login">Login</NavLink>}
        {user && (
          <NavLink to="/logout" onClick={handleLogout}>
            Logout
          </NavLink>
        )}
      </nav>
      {children}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User>(null);

  return (
    <UserContext.Provider value={user}>
      <Router>
        <Parent path="/" setUser={setUser}>
          <Home path="/" />
          <Login path="/login" setUser={setUser} />
        </Parent>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
