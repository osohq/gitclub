import { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Issue, Org, Repo } from '../../models';
import { issue as issueApi, org as orgApi, repo as repoApi } from '../../api';

interface ShowProps extends RouteComponentProps {
  issueId?: string;
  orgId?: string;
  repoId?: string;
}

export function Show({ issueId, orgId, repoId }: ShowProps) {
  const [org, setOrg] = useState<Org>();
  const [repo, setRepo] = useState<Repo>();
  const [issue, setIssue] = useState<Issue>();

  useEffect(() => {
    orgApi.show(orgId).then(setOrg);
  }, [orgId]);

  useEffect(() => {
    repoApi.show(orgId, repoId).then(setRepo);
  }, [orgId, repoId]);

  useEffect(() => {
    issueApi.show(orgId, repoId, issueId).then(setIssue);
  }, [issueId, orgId, repoId]);

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
