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
import {
  OrgIndex,
  OrgNew,
  OrgShow,
  RepoIndex,
  RepoNew,
  RepoShow,
} from './views';
import { user as userApi } from './api';

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
    await userApi.logout();
    setUser('Guest');
  }

  const home = <Link to="/">Home</Link>;
  const orgs = <Link to="/orgs">Orgs</Link>;
  const login = <Link to="/login">Login</Link>;
  const logout = (
    <Link to="/logout" onClick={handleLogout}>
      Logout
    </Link>
  );
  const userStatus =
    user === 'Guest' ? (
      login
    ) : (
      <>
        {logout} Logged in as {user.email}
      </>
    );

  return (
    <div>
      <nav>
        {home} {orgs} {userStatus}
      </nav>
      {children}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<LoggedInUser>('Guest');

  useEffect(() => {
    userApi.whoami().then(setUser);
  }, []);

  return (
    <UserContext.Provider value={user}>
      <Router>
        <Parent path="/" setUser={setUser}>
          <Home path="/" />
          <Login path="/login" setUser={setUser} />

          <OrgIndex path="/orgs" />
          <OrgNew path="/orgs/new" />
          <OrgShow path="/orgs/:orgId" />

          <RepoIndex path="/orgs/:orgId/repos" />
          <RepoNew path="/orgs/:orgId/repos/new" />
          <RepoShow path="/orgs/:orgId/repos/:repoId" />
        </Parent>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
