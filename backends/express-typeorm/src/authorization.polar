allow(actor, action, resource) if
  has_permission(actor, action, resource);

actor User {}

resource Org {
  roles = ["owner"];
  permissions = [];
}

has_role(user: User, name: String, org: Org) if
    role in user.orgRoles and
    role matches { role: name, org: org };

resource Repo {
  roles = ["admin", "writer", "reader"];
  permissions = [];
  relations = { parent: Org };
  "admin" if "owner" on "parent";
}

has_role(user: User, name: String, repo: Repo) if
    role in user.repoRoles and
    role matches { role: name, repo: repo };

has_relation(org: Org, "parent", _: Repo{org: org});

resource Issue {
  permissions = ["read"];
  relations = { parent: Repo };

  "read" if "admin" on "parent";
}

# The bug is solved if you change this to:
# has_relation(repo: Repo, "parent", _: Issue{repo: repo});
has_relation(repo: Repo, "parent", issue: Issue) if
  repo.id = issue.repoId;
