import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org, Repo } from '../../models';
import { org as orgApi, repo as repoApi } from '../../api';
import { UserContext } from '../../App';

interface IndexProps extends RouteComponentProps {
  orgId?: string;
}

export function Index({ orgId }: IndexProps) {
  const user = useContext(UserContext);
  const [org, setOrg] = useState<Org>();
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    orgApi.show(orgId).then(setOrg);
  }, [orgId]);

  useEffect(() => {
    repoApi.index(orgId).then(setRepos);
  }, [orgId]);

  if (!org) return null;

  const maybeNewLink =
    user === 'Guest' ? null : (
      <Link to={`/orgs/${orgId}/repos/new`}>Create new repo</Link>
    );

  return (
    <>
      <h2>{org.name} repos</h2>
      <ul>
        {repos.map((r) => (
          <li key={'repo-' + r.id}>
            <Link to={`/orgs/${org.id}/repos/${r.id}`}>
              {r.id} - {r.name}
            </Link>
          </li>
        ))}
      </ul>
      {maybeNewLink}
    </>
  );
}
