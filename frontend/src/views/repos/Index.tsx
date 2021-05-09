import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org, Repo, UserContext } from '../../models';
import { org as orgApi, repo as repoApi } from '../../api';
import { NoticeContext } from '../../components';

type Props = RouteComponentProps & { orgId?: string };

export function Index({ orgId }: Props) {
  const user = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId) return;
    repoApi(orgId)
      .index()
      .then(setRepos)
      .catch((e) => redirectWithError(`Failed to fetch repos: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!org) return null;

  const maybeNewLink = !user.loggedIn() ? null : (
    <Link to={`/orgs/${orgId}/repos/new`}>Create new repo</Link>
  );

  return (
    <>
      <h1>
        <Link to={`/orgs/${org.id}`}>{org.name}</Link> repos
      </h1>
      <ul>
        {repos.map((r) => (
          <li key={'repo-' + r.id}>
            <Link to={`/orgs/${org.id}/repos/${r.id}`}>{r.name}</Link>
          </li>
        ))}
      </ul>
      {maybeNewLink}
    </>
  );
}
