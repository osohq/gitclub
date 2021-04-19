import React, { useEffect, useState } from 'react';
import { Redirect, RouteComponentProps, Router } from '@reach/router';

import { User } from './models';
import {
  Home,
  Login,
  Nav,
  IssueIndex,
  IssueNew,
  IssueShow,
  OrgIndex,
  OrgNew,
  OrgShow,
  RepoIndex,
  RepoNew,
  RepoShow,
  UserShow,
} from './views';
import { user as userApi } from './api';
import { FlashNotice } from './components';
import type { Notice } from './components';

import './App.css';

type LoggedInUser = User | 'Guest' | 'Loading';

export const UserContext = React.createContext<{
  current: LoggedInUser;
  loggedIn: () => boolean;
  update: (u: LoggedInUser) => void;
}>({
  current: 'Loading',
  loggedIn: () => false,
  update: (_) => console.error('override me'),
});

export const NotifyContext = React.createContext({
  error: (text: string) => console.error(text),
});

const NotFound = (_: RouteComponentProps) => <Redirect to="/" noThrow />;

const probablyCorsError = (e: Error) =>
  e instanceof TypeError &&
  e.message === 'NetworkError when attempting to fetch resource.';

function App() {
  const [user, setUser] = useState<LoggedInUser>('Loading');
  const [notices, setNotices] = useState<Map<string, Notice>>(new Map());

  const pushNotice = (n: Notice) => {
    if (!notices.has(n.type + n.text))
      setNotices((ns) => new Map(ns.set(n.type + n.text, n)));
  };
  const popNotice = (n: Notice) =>
    setNotices((ns) => {
      ns.delete(n.type + n.text);
      return new Map(ns);
    });
  const notify = {
    error: (text: string) => pushNotice({ type: 'error', text }),
  };

  useEffect(() => {
    userApi
      .whoami()
      .then(setUser)
      .catch((e) => {
        if (probablyCorsError(e)) {
          notify.error('Probable CORS error. Is the backend running?');
        } else {
          notify.error(e.message);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flashNotices = [...notices].map(([, notice], i) => (
    <FlashNotice key={i} notice={notice} clear={() => popNotice(notice)} />
  ));

  const userContext = {
    current: user,
    loggedIn: () => user instanceof User,
    update: setUser,
  };

  return (
    <NotifyContext.Provider value={notify}>
      <UserContext.Provider value={userContext}>
        <>{flashNotices}</>
        <Nav />
        <Router>
          <Home path="/" />
          <Login path="/login" />

          <IssueIndex path="/orgs/:orgId/repos/:repoId/issues" />
          <IssueNew path="/orgs/:orgId/repos/:repoId/issues/new" />
          <IssueShow path="/orgs/:orgId/repos/:repoId/issues/:issueId" />

          <OrgIndex path="/orgs" />
          <OrgNew path="/orgs/new" />
          <OrgShow path="/orgs/:orgId" />

          <RepoIndex path="/orgs/:orgId/repos" />
          <RepoNew path="/orgs/:orgId/repos/new" />
          <RepoShow path="/orgs/:orgId/repos/:repoId" />

          <UserShow path="/users/:userId" />

          <NotFound default />
        </Router>
      </UserContext.Provider>
    </NotifyContext.Provider>
  );
}

export default App;
