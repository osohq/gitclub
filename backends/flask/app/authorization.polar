# Users can see each other.
allow(_: User, "read", _: User);

# Users can see their own profiles
allow(user: User, "read_profile", user);


# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# ROLES

resource(_type: Org, "org", actions, roles) if
    # TODO(gj): might be able to cut down on some repetition with namespacing, e.g., `role_assignments::{create, list, update, delete}`
    actions = ["read", "create_repos", "list_repos",
               "create_role_assignments", "list_role_assignments",
               "update_role_assignments", "delete_role_assignments"] and
    roles = {
        member: {
            permissions: ["read", "list_repos", "list_role_assignments"],
            implies: ["repo:reader"]
        },
        owner: {
            permissions: ["create_repos", "create_role_assignments",
                          "update_role_assignments", "delete_role_assignments"],
            implies: ["member", "repo:admin"]
        }
    };

resource(_type: Repo, "repo", actions, roles) if
    actions = ["read", "create_issues", "list_issues",
               "create_role_assignments", "list_role_assignments",
               "update_role_assignments", "delete_role_assignments"] and
    roles = {
        admin: {
            permissions: ["create_role_assignments", "list_role_assignments",
                          "update_role_assignments", "delete_role_assignments"],
            implies: ["writer"]
        },
        writer: {
            permissions: ["create_issues"],
            implies: ["reader"]
        },
        reader: {
            permissions: ["read", "list_issues", "issue:read"]
        }
    };

resource(_type: Issue, "issue", ["read"], {});

parent_child(repo: Repo, _: Issue{repo_id: repo.id});

parent_child(org: Org, _: Repo{org: org});

allow(actor, action, resource) if
    role_allows(actor, action, resource);

actor_has_role_for_resource(_: User{org_roles: roles}, name: String, org: Org) if
  role in roles and
  role matches { name: name, org: org };

actor_has_role_for_resource(_: User{repo_roles: roles}, name: String, repo: Repo) if
  role in roles and
  role matches { name: name, repo: repo };
