import React, {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  Link,
  LinkProps,
  Redirect,
  RouteComponentProps,
  Router,
} from '@reach/router';

import './App.css';

type UserDetails = { id: number; email: string };

class User {
  id: number;
  email: string;

  constructor({ id, email }: UserDetails) {
    this.id = id;
    this.email = email;
  }
}

type LoggedInUser = User | 'Guest';

const UserContext = React.createContext<LoggedInUser>('Guest');

const Home = (_: RouteComponentProps) => <h1>GitClub</h1>;

type SetUserProp = { setUser: (user: LoggedInUser) => void };

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
      const details: UserDetails = await res.json();
      return new User(details);
    } else {
      console.error('TODO(gj): better error handling -- alert?');
    }
  } catch (e) {
    console.error('wot', e);
  }
}

function Login({ setUser }: LoginProps) {
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

  async function handleLogout(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/logout', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 200) {
        setUser('Guest');
      } else {
        console.error('sad trombone');
      }
    } catch (e) {
      console.error('wat', e);
    }
  }

  const home = <NavLink to="/">Home</NavLink>;
  const login = <NavLink to="/login">Login</NavLink>;
  const logout = (
    <NavLink to="/logout" onClick={handleLogout}>
      Logout
    </NavLink>
  );
  const nav =
    user === 'Guest' ? (
      <nav>
        {home} {login}
      </nav>
    ) : (
      <nav>
        {home} {logout} Logged in as {user.email}
      </nav>
    );

  return (
    <div>
      {nav}
      {children}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<LoggedInUser>('Guest');

  useEffect(() => {
    (async function () {
      try {
        const res = await fetch('http://localhost:5000/whoami', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (res.status === 200) {
          const details: UserDetails | null = await res.json();
          if (details) setUser(new User(details));
        }
      } catch (_) {}
    })();
  }, []);

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
