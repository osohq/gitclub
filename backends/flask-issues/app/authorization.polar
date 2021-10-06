actor User{}

resource Repo {
  permissions = ["create_issue", "list_issues"];
}

has_permission(_user: User, action: String, repo: Repo) if
  action in repo.permissions;

resource Issue {
  permissions = ["read"];
  relations = { parent: Repo };
  # "read" if "list_issues" on "parent";
}

has_relation(repo: Repo, "parent", issue: Issue) if issue.repo = repo;

allow(actor, action, resource) if
  has_permission(actor, action, resource);
