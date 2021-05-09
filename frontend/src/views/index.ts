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

import { Index as RepoIndex } from './repos/Index';
import { New as RepoNew } from './repos/New';
import { Settings as RepoSettings } from './repos/Settings';
import { Show as RepoShow } from './repos/Show';

import { Show as UserShow } from './users/Show';

export const View = {
  Home,
  Login,
  Nav,
  NotFound,
  Notices,

  Issue: { Index: IssueIndex, New: IssueNew, Show: IssueShow },

  Org: { Index: OrgIndex, New: OrgNew, Show: OrgShow },

  Repo: {
    Index: RepoIndex,
    New: RepoNew,
    Settings: RepoSettings,
    Show: RepoShow,
  },

  User: { Show: UserShow },
};
