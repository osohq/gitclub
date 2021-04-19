import { useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';

import { User } from '../../models';
import { user as userApi } from '../../api';

type ShowProps = RouteComponentProps & {
  userId?: string;
};

export function Show({ navigate, userId }: ShowProps) {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    userApi
      .show(userId)
      .then((u) => setUser(u))
      .catch(() =>
        navigate!('/', { state: { error: `/users/${userId} not found.` } })
      );
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  return <h1>{user.email}</h1>;
}
