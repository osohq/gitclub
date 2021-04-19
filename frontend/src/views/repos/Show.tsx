import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org, Repo } from '../../models';
import { org as orgApi, repo as repoApi } from '../../api';
import { NotifyContext } from '../../App';

interface ShowProps extends RouteComponentProps {
  orgId?: string;
  repoId?: string;
}

export function Show({ orgId, repoId }: ShowProps) {
  const { error } = useContext(NotifyContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();

  useEffect(() => {
    orgApi.show(orgId).then(setOrg).catch(error);
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    repoApi.show(orgId, repoId).then(setRepo).catch(error);
  }, [orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!org || !repo) return null;

  return (
    <>
      <h1>
        <Link to={`/orgs/${org.id}`}>{org.name}</Link> / {repo.name}
      </h1>
      <h2>
        <Link to={`/orgs/${orgId}/repos/${repoId}/issues`}>Issues</Link>
      </h2>
    </>
  );
}
