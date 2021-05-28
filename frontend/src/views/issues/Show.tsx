import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Issue, Org, Repo, UserContext } from '../../models';
import { issue as issueApi, org as orgApi, repo as repoApi } from '../../api';
import { NoticeContext } from '../../components';

type Props = RouteComponentProps & {
  issueId?: string;
  orgId?: string;
  repoId?: string;
};

export function Show({ issueId, orgId, repoId }: Props) {
  const { current: currentUser } = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [issue, setIssue] = useState<Issue>();

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [currentUser, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId) return;
    repoApi(orgId)
      .show(repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [currentUser, orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId || !repoId || !issueId) return;
    issueApi(orgId, repoId)
      .show(issueId)
      .then(setIssue)
      .catch((e) => redirectWithError(`Failed to fetch issue: ${e.message}`));
  }, [currentUser, issueId, orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!issue || !org || !repo) return null;

  return (
    <>
      <h1>
        <Link to={`/orgs/${org.id}`}>{org.name}</Link> /{' '}
        <Link to={`/orgs/${org.id}/repos/${repo.id}`}>{repo.name}</Link> /{' '}
        <Link to={`/orgs/${org.id}/repos/${repo.id}/issues`}>issues</Link> /{' '}
        {issue.id}
      </h1>
      <h2>{issue.title}</h2>
    </>
  );
}
