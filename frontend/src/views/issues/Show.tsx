import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Issue, Org, Repo } from '../../models';
import { issue as issueApi, org as orgApi, repo as repoApi } from '../../api';
import { NoticeContext } from '..';

interface ShowProps extends RouteComponentProps {
  issueId?: string;
  orgId?: string;
  repoId?: string;
}

export function Show({ issueId, orgId, repoId }: ShowProps) {
  const { redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [issue, setIssue] = useState<Issue>();

  useEffect(() => {
    orgApi
      .show(orgId)
      .then(setOrg)
      .catch((e) => redirectWithError(`Failed to fetch org: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    repoApi
      .show(orgId, repoId)
      .then(setRepo)
      .catch((e) => redirectWithError(`Failed to fetch repo: ${e.message}`));
  }, [orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    issueApi
      .show(orgId, repoId, issueId)
      .then(setIssue)
      .catch((e) => redirectWithError(`Failed to fetch issue: ${e.message}`));
  }, [issueId, orgId, repoId]); // eslint-disable-line react-hooks/exhaustive-deps

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
