# Users can see each other.
allow(_: User, "read", _: User);

# Users can see their own profiles
allow(_: User{id: id}, "read_profile", _: User{id: id});


# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# ROLES

resource(_type: Org, "org", actions, roles) if
    # TODO(gj): might be able to cut down on some repetition with namespacing, e.g., `role_assignments::{create, list, update, delete}`
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

resource(_type: Issue, "issue", actions, roles) if
    actions = ["read"] and
    roles = {};

parent_child(parent_repo: Repo, issue: Issue) if
    issue.repo = parent_repo;

parent_child(parent_org: Org, repo: Repo) if
    repo.org = parent_org;

allow(actor, action, resource) if
    role_allows(actor, action, resource);


actor_has_role_for_resource(actor: User, role_name: String, resource: Org) if
    role in actor.org_roles and
    role_name = role.name and
    resource.id = role.org_id;

actor_has_role_for_resource(actor: User, role_name: String, resource: Repo) if
    role in actor.repo_roles and
    role_name = role.name and
    resource.id = role.repo_id;
