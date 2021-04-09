import { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org, Repo } from '../../models';
import { org as orgApi, repo as repoApi } from '../../api';

interface ShowProps extends RouteComponentProps {
  orgId?: string;
  repoId?: string;
}

export function Show({ orgId, repoId }: ShowProps) {
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();

  useEffect(() => {
    orgApi.show(orgId).then(setOrg);
  }, [orgId]);

  useEffect(() => {
    repoApi.show(orgId, repoId).then(setRepo);
  }, [orgId, repoId]);

  if (!org || !repo) return null;

  return (
    <>
      <Link to={`/orgs/${orgId}/repos`}>Back to {org.name} repos</Link>
      <h1>{repo.name}</h1>
      <Link to={`/orgs/${orgId}/repos/${repoId}/issues`}>Issues</Link>
    </>
  );
}
