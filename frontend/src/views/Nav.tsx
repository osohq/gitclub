import React, { useContext } from 'react';
import { Link } from '@reach/router';

import { UserContext } from '../App';
import { user as userApi } from '../api';
import { User } from '../models';

export function Nav() {
  const user = useContext(UserContext);

  async function handleLogout(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    await userApi.logout();
    user.update('Guest');
  }

  const login = <Link to="/login">Login</Link>;
  const logout = (
    <Link to="/" onClick={handleLogout}>
      Logout
    </Link>
  );
  const userStatus =
    user.current instanceof User ? (
      <>
        {logout} Logged in as {user.current.email}
      </>
    ) : (
      login
    );

  const home = <Link to="/">Home</Link>;
  const orgs = <Link to="/orgs">Orgs</Link>;

  return (
    <nav>
      {home} {orgs} {userStatus}
    </nav>
  );
}
