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
import { OrgShow } from './orgs';
import { OrgsIndex, OrgsNew } from './views';

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
  const login = <Link to="/login">Login</Link>;
  const logout = (
    <Link to="/logout" onClick={handleLogout}>
      Logout
    </Link>
  );
  const nav =
    user === 'Guest' ? (
      <nav>
        {home} {orgs} {login}
      </nav>
    ) : (
      <nav>
        {home} {orgs} {logout} Logged in as {user.email}
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
          <OrgsIndex path="/orgs" />
          <OrgsNew path="/orgs/new" />
          <OrgShow path="/orgs/:orgId" />
        </Parent>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
