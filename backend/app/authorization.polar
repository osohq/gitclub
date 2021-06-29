# Users can see each other.
allow(_: User, "read", _: User);

# Users can see their own profiles
allow(_: User{id: id}, "read_profile", _: User{id: id});


# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# ROLES

resource(_type: Org, "org", actions, roles) if
    actions = ["read", "create_repos", "list_repos",
               "create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"] and
    roles = {
        member: {
            permissions: ["read", "list_repos", "list_role_assignments"],
            implies: ["repo:reader"]
        },
        owner: {
            permissions: ["create_repos", "create_role_assignments", "update_role_assignments", "delete_role_assignments"],
            implies: ["member", "repo:admin"]
        }
    };

resource(_type: Repo, "repo", actions, roles) if
    actions = ["read", "create_issues", "list_issues",
               "create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"] and
    roles = {
        admin: {
            permissions: ["create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"],
            implies: ["repo:writer"]
        },
        writer: {
            permissions: ["create_issues"],
            implies: ["repo:reader"]
        },
        reader: {
            permissions: ["read", "list_issues", "issue:read"]
        }
    };

resource(_type: Issue, "issue", actions, _) if
    actions = ["read"];

parent_child(parent_repo: Repo, issue: Issue) if
    issue.repo = parent_repo;

parent_child(parent_org: Org, repo: Repo) if
    repo.org = parent_org;

allow(actor, action, resource) if
    Roles.role_allows(actor, action, resource);

