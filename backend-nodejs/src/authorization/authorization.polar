# Users can see themselves.
allow(_: User{id: id}, "read", _: User{id: id});

# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# ROLES

resource(_type: Org, "org", actions, roles) if
    actions = ["read", "create_repos", "list_repos",
               "create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"] and
    roles = {
        org_member: {
            perms: ["read", "list_repos", "list_role_assignments"],
            implies: ["repo_read"]
        },
        org_owner: {
            perms: ["create_repos", "create_role_assignments", "update_role_assignments", "delete_role_assignments"],
            implies: ["org_member", "repo_admin"]
        }
    };

resource(_type: Repo, "repo", actions, roles) if
    actions = ["read", "create_issues", "list_issues",
               "create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"] and
    roles = {
        repo_admin: {
            perms: ["create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"],
            implies: ["repo_write"]
        },
        repo_write: {
            perms: ["create_issues"],
            implies: ["repo_read"]
        },
        repo_read: {
            perms: ["read", "list_issues", "issue:read"]
        }
    };

resource(_type: Issue, "issue", actions, _) if
    actions = ["read"];

parent(issue: Issue, parent_repo: Repo) if
    issue.repo = parent_repo;

parent(repo: Repo, parent_org: Org) if
    repo.org = parent_org;

allow(actor, action, resource) if
    Roles.role_allows(actor, action, resource);

