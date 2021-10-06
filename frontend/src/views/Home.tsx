import { RouteComponentProps } from '@reach/router';
import { useContext, useState, useEffect } from 'react';
import { NoticeContext } from '../components';
import { UserContext, Repo, User, Issue } from '../models';
import { userRepo as userRepoApi, org as orgApi, userIssue as userIssueApi } from '../api';
import { Repository, Issue as IssueComponent } from './components';


export function Home(_: RouteComponentProps) {
  const { current: user } = useContext(UserContext);
  const { redirectWithError } = useContext(NoticeContext);
  const [repos, setRepos] = useState<Repo[]>([]);
  // const [orgs, setOrgs] = useState<Org[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  // force the page to refresh every 1s
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setRefresh(old => old + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    async function getData() {
      const getOrgs = await orgApi.index()
      // console.log(JSON.stringify(getOrgs, null, 2));
      let getRepos: Repo[] = [];
      let getIssues: Issue[] = [];

      if (user instanceof User) {
        getRepos = await userRepoApi(user.id).index();
        for (const idx in getRepos) {
          const repo = getRepos[idx];
          getRepos[idx].org = getOrgs.find((org) => org.id === repo.orgId);
          // console.log(JSON.stringify(getRepos, null, 2));
        }

        getIssues = await userIssueApi(user.id)
          .index();

        for (const idx in getIssues) {
          const issue = getIssues[idx];
          getIssues[idx].repo = getRepos.find((repo) => repo.id === issue.repoId);
          // console.log(JSON.stringify(getIssues, null, 2));
        }
      }

      // setOrgs(getOrgs)
      setRepos(getRepos)
      setIssues(getIssues)
    }

    getData()
      .catch((e) => redirectWithError(`Failed to fetch data: ${e.message}`))


  }, [user, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <h1>GitClub</h1>

    <h2>Repositories</h2>
    {repos.map((r) => (
      <Repository repo={r} canDelete={r.permissions.includes("delete")} />
    ))
    }

    <h2>Issues</h2>
    {
      issues.filter((i) => i.repo !== undefined).map((i) => (
        <IssueComponent repo={i.repo!} issue={i} />
      ))
    }
  </>
}
