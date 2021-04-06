import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Link, RouteComponentProps, Router } from '@reach/router';

import { Login } from './Login';
import { User } from './models';
import { OrgIndex, OrgShow } from './orgs';

import './App.css';

type LoggedInUser = User | 'Guest';

export const UserContext = React.createContext<LoggedInUser>('Guest');

const Home = (_: RouteComponentProps) => <h1>GitClub</h1>;

export type SetUserProp = { setUser: Dispatch<SetStateAction<LoggedInUser>> };

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

  const home = <Link to="/">Home</Link>;
  const orgs = <Link to="/orgs">Orgs</Link>;
  const repos = <Link to="/repos">Repos</Link>;
  const login = <Link to="/login">Login</Link>;
  const logout = (
    <Link to="/logout" onClick={handleLogout}>
      Logout
    </Link>
  );
  const nav =
    user === 'Guest' ? (
      <nav>
        {home} {orgs} {repos} {login}
      </nav>
    ) : (
      <nav>
        {home} {orgs} {repos} {logout} Logged in as {user.email}
      </nav>
    );

  return (
    <div>
      {nav}
      {children}
    </div>
  );
}

class Repo {
  id: number;
  name: string;

  constructor({ id, name }: { id: number; name: string }) {
    this.id = id;
    this.name = name;
  }
}

function Repos(_: RouteComponentProps) {
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    (async function () {
      try {
        const res = await fetch('http://localhost:5000/repos', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (res.status === 200) {
          const repos: Repo[] = await res.json();
          setRepos(repos);
        }
      } catch (_) {}
    })();
  }, []);

  return (
    <ul>
      {repos.map((r) => (
        <li>
          {r.id} - {r.name}
        </li>
      ))}
    </ul>
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
          const details: User | null = await res.json();
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
          <OrgIndex path="/orgs" />
          <OrgShow path="/orgs/:orgId" />
          <Repos path="/repos" />
        </Parent>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
