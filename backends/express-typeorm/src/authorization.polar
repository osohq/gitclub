allow(actor, action, resource) if
  has_permission(actor, action, resource);

# Users can see each other.
has_permission(_: User, "read", _: User);

# A User can read their own profile.
has_permission(_: User{id: id}, "read_profile", _:User{id: id});

# Any logged-in user can create a new org.
has_permission(_: User, "create", _: Org);

actor User {}

resource Org {
  roles = ["owner", "member"];
  permissions = [
    "read",
    "create_repos",
    "list_repos",
    "create_role_assignments",
    "list_role_assignments",
    "update_role_assignments",
    "delete_role_assignments",
  ];

  "read" if "member";
  "list_repos" if "member";
  "list_role_assignments" if "member";

  "create_repos" if "owner";
  "create_role_assignments" if "owner";
  "update_role_assignments" if "owner";
  "delete_role_assignments" if "owner";

  "member" if "owner";
}

has_role(user: User, name: String, org: Org) if
    role in user.orgRoles and
    role matches { role: name, org: org };

resource Repo {
  roles = ["admin", "maintainer", "reader"];
  permissions = [
    "read",
    "create_issues",
    "list_issues",
    "create_role_assignments",
    "list_role_assignments",
    "update_role_assignments",
    "delete_role_assignments",
  ];
  relations = { parent: Org };

  "create_role_assignments" if "admin";
  "list_role_assignments" if "admin";
  "update_role_assignments" if "admin";
  "delete_role_assignments" if "admin";

  "create_issues" if "maintainer";

  "read" if "reader";
  "list_issues" if "reader";

  "admin" if "owner" on "parent";
  "reader" if "member" on "parent";

  "maintainer" if "admin";
  "reader" if "maintainer";
}

has_role(user: User, name: String, repo: Repo) if
    role in user.repoRoles and
    role matches { role: name, repo: repo };

has_relation(org: Org, "parent", _: Repo{org: org});

resource Issue {
  permissions = ["read"];
  relations = { parent: Repo };

  "read" if "reader" on "parent";
}

has_relation(repo: Repo, "parent", _: Issue{repo: repo});
