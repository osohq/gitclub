import { useContext, useEffect, useState } from 'react';
import { Link, Redirect, RouteComponentProps } from '@reach/router';

import { Org, Repo, UserContext } from '../../models';
import { NoticeContext } from '../../components';
import { org as orgApi, repo as repoApi } from '../../api';

type Props = RouteComponentProps & { orgId?: string; repoId?: string };

export function Settings({ orgId, repoId }: Props) {
  const user = useContext(UserContext);
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

  if (!orgId || !repoId) return null;
  const show = `/orgs/${orgId}/repos/${repoId}`;

  if (user.current === 'Loading') return null;
  // If a guest navigates to this page, redirect to the repo show.
  if (user.current === 'Guest') return <Redirect to={show} noThrow />;

  if (!org || !repo) return null;

  return (
    <>
      <h1>
        <Link to={`/orgs/${org.id}`}>{org.name}</Link> / {repo.name} / settings
      </h1>

      <h2>Manage Access</h2>
    </>
  );
}
