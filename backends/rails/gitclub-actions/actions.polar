allow(user, action, resource) if has_permission(user, action, resource);

actor User {}

resource Repository {
  roles = ["reader", "maintainer"];
  permissions = ["list_actions"];

  # Can list a repo's actions if you can read the repo
  "list_actions" if "reader";
}

# Pull repository roles from external server
has_role(user: User, role_name: String, repo: Repository) if
  Oso.has_role(user, role_name, repo);

resource Action {
  permissions = ["read", "restart", "cancel"];
  relations = { repository: Repository };

  # Reader permissions
  "read" if "reader" on "repository";

  # Maintainer permissions
  "restart" if "maintainer" on "repository";
}

# Can do ABAC on local resources (like actions)
has_permission(user: User, "cancel", action: Action) if
  action.status = "running" and has_role(user, "maintainer", action.repository);

# Define how actions and repositories are related
has_relation(repository: Repository, "repository", action: Action) if
  action.repository = repository;
