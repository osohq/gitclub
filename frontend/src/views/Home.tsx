import { Link, RouteComponentProps } from '@reach/router';
import { useContext, useState, useEffect } from 'react';
import { NoticeContext } from '../components';
import { UserContext, Repo, User, Org, Issue } from '../models';
import { userRepo as userRepoApi, org as orgApi, userIssue as userIssueApi } from '../api';


export function Home(_: RouteComponentProps) {
  const { current: user } = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    orgApi.index()
      .then(setOrgs)
      .catch((e) => redirectWithError(`Failed to fetch organizations: ${e.message}`))

    if (user instanceof User) {
      userRepoApi(user.id)
        .index()
        .then((repos) => {
          repos.forEach((repo: Repo, i, arr) => {
            arr[i].org = orgs.find((org) => org.id = repo.orgId);
          });
          setRepos(repos)
          userIssueApi(user.id)
            .index()
            .then((issues) => {
              issues.forEach((issue: Issue, i, arr) => {
                arr[i].repo = repos.find((repo) => repo.id = issue.repoId);
              });
              setIssues(issues)
            })
            .catch((e) => redirectWithError(`Failed to fetch repositories: ${e.message}`));
        })
        .catch((e) => redirectWithError(`Failed to fetch repositories: ${e.message}`));

    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <h1>GitClub</h1>

    <h2>Repositories</h2>
    {repos.map((r) => (
      <li key={'repo-' + r.id}>
        <Link to={`/orgs/${r.orgId}/repos/${r.id}`}>
          {r.org?.name} / <span style={{ fontWeight: 700 }}>{r.name}</span>
        </Link>
      </li>
    ))
    }

    <h2>Issues</h2>
    {
      issues.map((i) => (
        <li key={'issue-' + i.id}>
          <Link to={`/orgs/${i.repo?.orgId}/repos/${i.repo?.id}/issues/${i.id}`}>
            {i.repo?.org?.name} / {i.repo?.name}
            <br />
            #{i.id} <span style={{ fontWeight: 700 }}>{i.title}</span>
          </Link>
        </li>
      ))
    }


  </>
}
