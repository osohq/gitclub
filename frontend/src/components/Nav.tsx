import React, { useContext } from 'react';
import { Link } from '@reach/router';

import type { SetUserProp } from '../App';
import { UserContext } from '../App';
import { user as userApi } from '../api';

export function Nav({ setUser }: SetUserProp) {
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
    <nav>
      {home} {orgs} {userStatus}
    </nav>
  );
}
