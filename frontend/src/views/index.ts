import { Home } from './Home';
import { Login } from './Login';
import { Nav } from './Nav';
import { NotFound } from './NotFound';
import { Notices } from './Notices';

import { Index as IssueIndex } from './issues/Index';
import { New as IssueNew } from './issues/New';
import { Show as IssueShow } from './issues/Show';

import { Index as OrgIndex } from './orgs/Index';
import { New as OrgNew } from './orgs/New';
import { Show as OrgShow } from './orgs/Show';

import { Index as OrgRepoIndex } from './orgs/repos/Index';
import { New as OrgRepoNew } from './orgs/repos/New';
import { Settings as OrgRepoSettings } from './orgs/repos/Settings';
import { Show as OrgRepoShow } from './orgs/repos/Show';

import { Show as UserShow } from './users/Show';
import { Index as UserRepoIndex } from './users/repos/Index';

export const View = {
  Home,
  Login,
  Nav,
  NotFound,
  Notices,

  Issue: { Index: IssueIndex, New: IssueNew, Show: IssueShow },

  Org: {
    Index: OrgIndex,
    New: OrgNew,
    Show: OrgShow,
    Repo: {
      Index: OrgRepoIndex,
      New: OrgRepoNew,
      Settings: OrgRepoSettings,
      Show: OrgRepoShow,
    }
  },

  User: {
    Show: UserShow,
    Repo: {
      Index: UserRepoIndex
    }
  },
};
