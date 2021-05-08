import { MouseEvent, useContext } from 'react';
import { Link } from '@reach/router';

import { session as sessionApi } from '../api';
import { User, UserContext } from '../models';
import { NoticeContext } from '../components';

export function Nav() {
  const { error } = useContext(NoticeContext);
  const user = useContext(UserContext);

  async function handleLogout(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      await sessionApi.logout();
      user.update('Guest');
    } catch (e) {
      error(`Failed to log out: ${e.message}`);
    }
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
