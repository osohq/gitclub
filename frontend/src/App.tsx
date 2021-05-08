import { useContext, useEffect, useState } from 'react';
import { Router } from '@reach/router';

import { LoggedInUser, User, UserContext } from './models';
import {
  Home,
  Login,
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
import { session as sessionApi } from './api';
import { NoticeContext } from './components';

import './App.css';

function App() {
  const { error } = useContext(NoticeContext);

  const [user, setUser] = useState<LoggedInUser>('Loading');
  const loggedIn = () => user instanceof User;
  const userContext = { current: user, loggedIn, update: setUser };

  useEffect(() => {
    sessionApi
      .whoami()
      .then(setUser)
      .catch((e) => error(`Failed to fetch current user: ${e.message}`));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UserContext.Provider value={userContext}>
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
