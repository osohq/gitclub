import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Repo, User, UserContext } from '../../../models';
import { userRepo as repoApi } from '../../../api';
import { NoticeContext } from '../../../components';

type Props = RouteComponentProps & { userId?: string };

export function Index({ userId }: Props) {
  const { current: currentUser } = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    if (!userId) return;
    repoApi(userId)
      .index()
      .then(setRepos)
      .catch((e) => redirectWithError(`Failed to fetch repos: ${e.message}`));
  }, [currentUser, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!(currentUser instanceof User)) return null;
        

  return (
    <>
      <h1>
        <Link to={`/users/${userId}`}>{currentUser.email}</Link> repos
      </h1>
      <ul>
        {repos.map((r) => (
          <li key={'repo-' + r.id}>
            <Link to={`/orgs/${r.orgId}/repos/${r.id}`}>{r.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
