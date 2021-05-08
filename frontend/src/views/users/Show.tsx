import { useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';

import { User } from '../../models';
import { user as userApi } from '../../api';
import { NoticeContext } from '../../components';

type ShowProps = RouteComponentProps & { userId?: string };

export function Show({ userId }: ShowProps) {
  const { redirectWithError } = useContext(NoticeContext);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (!userId) return;
    userApi
      .show(userId)
      .then((u) => setUser(u))
      .catch(redirectWithError);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId || !user) return null;

  return <h1>{user.email}</h1>;
}
