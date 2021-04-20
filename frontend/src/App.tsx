import React, { useContext, useEffect, useState } from 'react';
import { Router } from '@reach/router';

import { User } from './models';
import {
  Home,
  Login,
  Nav,
  NotFound,
  Notices,
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
import { NoticeContext } from './views';

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

const probablyCorsError = (e: Error) =>
  e instanceof TypeError &&
  e.message === 'NetworkError when attempting to fetch resource.';

function App() {
  const [user, setUser] = useState<LoggedInUser>('Loading');
  const { error } = useContext(NoticeContext);

  useEffect(() => {
    userApi
      .whoami()
      .then(setUser)
      .catch((e) => {
        if (probablyCorsError(e)) {
          error('Probable CORS error. Is the backend running?');
        } else {
          error(e.message);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loggedIn = () => user instanceof User;
  const userContext = { current: user, loggedIn, update: setUser };

  return (
    <UserContext.Provider value={userContext}>
      <Nav />
      <Router>
        <Notices path="/">
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
        </Notices>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
