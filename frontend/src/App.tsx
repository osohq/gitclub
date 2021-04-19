import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Link, Redirect, RouteComponentProps, Router } from '@reach/router';

import { Login } from './Login';
import { User } from './models';
import {
  IssueIndex,
  IssueNew,
  IssueShow,
  OrgIndex,
  OrgNew,
  OrgShow,
  RepoIndex,
  RepoNew,
  RepoShow,
} from './views';
import { user as userApi } from './api';
import { FlashNotice } from './components';
import type { Notice } from './components';

import './App.css';

type LoggedInUser = User | 'Guest';

export const UserContext = React.createContext<LoggedInUser>('Guest');

const Home = (_: RouteComponentProps) => <h1>GitClub</h1>;
const NotFound = (_: RouteComponentProps) => <Redirect to="/" noThrow />;

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

const probablyCorsError = (e: Error) =>
  e instanceof TypeError &&
  e.message === 'NetworkError when attempting to fetch resource.';

function App() {
  const [user, setUser] = useState<LoggedInUser>('Guest');
  const [notices, setNotices] = useState<Map<string, Notice>>(new Map());

  const pushNotice = (n: Notice) =>
    !notices.has(n.type + n.text) &&
    setNotices((ns) => new Map(ns.set(n.type + n.text, n)));
  const pushError = (text: string) => pushNotice({ type: 'error', text });
  const popNotice = (n: Notice) =>
    setNotices((ns) => {
      ns.delete(n.type + n.text);
      return new Map(ns);
    });

  useEffect(() => {
    userApi
      .whoami()
      .then(setUser)
      .catch((e) => {
        if (probablyCorsError(e)) {
          pushError('Probable CORS error. Is the backend running?');
        } else {
          pushError(e.message);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flashNotices = [...notices].map(([, notice], i) => (
    <FlashNotice key={i} notice={notice} clear={() => popNotice(notice)} />
  ));

  return (
    <UserContext.Provider value={user}>
      <>{flashNotices}</>
      <Router>
        <Parent path="/" setUser={setUser}>
          <Home path="/" />
          <Login path="/login" setUser={setUser} />

          <IssueIndex path="/orgs/:orgId/repos/:repoId/issues" />
          <IssueNew path="/orgs/:orgId/repos/:repoId/issues/new" />
          <IssueShow path="/orgs/:orgId/repos/:repoId/issues/:issueId" />

          <OrgIndex path="/orgs" />
          <OrgNew path="/orgs/new" />
          <OrgShow path="/orgs/:orgId" />

          <RepoIndex path="/orgs/:orgId/repos" />
          <RepoNew path="/orgs/:orgId/repos/new" />
          <RepoShow path="/orgs/:orgId/repos/:repoId" />

          <NotFound default />
        </Parent>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
