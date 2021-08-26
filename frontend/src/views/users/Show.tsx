import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { User, UserContext } from '../../models';
import { user as userApi } from '../../api';
import { NoticeContext } from '../../components';

type Props = RouteComponentProps & { userId?: string };

export function Show({ userId }: Props) {
  const { current: currentUser } = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (!userId) return;
    userApi.show(userId).then(setUser).catch(redirectWithError);
  }, [currentUser, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId || !user) return null;

  return (
    <>
      <h1>{user.email}</h1>
      <h2>
        <Link to={`/users/${userId}/repos`}>Repos</Link>
      </h2>
    </>
  );
}
