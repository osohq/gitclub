import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org, Repo } from '../../models';
import { org as orgApi, repo as repoApi } from '../../api';
import { NoticeContext } from '../../components';

type ShowProps = RouteComponentProps & { orgId?: string; repoId?: string };

export function Show({ orgId, repoId }: ShowProps) {
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    repoApi(orgId)
      .show(repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orgId || !org || !repoId || !repo) return null;

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
