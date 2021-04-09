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
      <Link to={`/orgs/${orgId}/repos/${repoId}/issues`}>
        Back to {org.name} / {repo.name} issues
      </Link>
      <h1>{issue.title}</h1>
    </>
  );
}
