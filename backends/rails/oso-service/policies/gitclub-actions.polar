# BELONGS TO GITCLUB-ACTIONS SERVICE
allow(user, action, resource) if has_permission(user, action, resource);

actor User {}

resource Repository {
  roles = ["reader", "maintainer"];
  permissions = ["list_actions"];

  # Can list a repo's actions if you can read the repo
  "list_actions" if "reader";
}

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
