import { useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from '@reach/router';

import { User } from '../../models';
import { user as userApi } from '../../api';
import { NoticeContext } from '../../components';

type Props = RouteComponentProps & { userId?: string };

export function Show({ userId }: Props) {
  const { redirectWithError } = useContext(NoticeContext);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (!userId) return;
    userApi.show(userId).then(setUser).catch(redirectWithError);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userId || !user) return null;

  return <h1>{user.email}</h1>;
}
