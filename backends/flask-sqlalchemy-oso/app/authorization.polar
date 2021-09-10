allow(actor, action, resource) if
  has_permission(actor, action, resource);

actor User {
  permissions = ["read"];
}

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

resource Repo {
  roles = ["admin", "writer", "reader"];
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

  "create_issues" if "writer";

  "read" if "reader";
  "list_issues" if "reader";

  "admin" if "owner" on "parent";
  "reader" if "member" on "parent";

  "writer" if "admin";
  "reader" if "writer";
}

resource Issue {
  permissions = ["read"];
  relations = { parent: Repo };
  "read" if "reader" on "parent";
}

resource OrgRole {
  permissions = ["read"];
  relations = { parent: Org };
  "read" if "list_role_assignments" on "parent";
}

resource RepoRole {
  permissions = ["read"];
  relations = { parent: Repo };
  "read" if "list_role_assignments" on "parent";
}

has_role(user: User, name: String, org: Org) if
    role in user.org_roles and
    role matches { name: name, org_id: org.id };

has_role(user: User, name: String, repo: Repo) if
    role in user.repo_roles and
    role matches { name: name, repo_id: repo.id };

has_relation(org: Org, "parent", repo: Repo) if repo.org = org;
has_relation(repo: Repo, "parent", issue: Issue) if issue.repo = repo;

has_relation(org: Org, "parent", role: OrgRole) if org = role.org;
has_relation(repo: Repo, "parent", role: RepoRole) if repo = role.repo;

# Users can see each other.
has_permission(_: User, "read", _: User);

# A User can read their own profile.
has_permission(_: User{id: id}, "read_profile", _:User{id: id});

# Any logged-in user can create a new org.
has_permission(_: User, "create", _: Org);
