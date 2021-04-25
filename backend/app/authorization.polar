## Users can see themselves.
allow(user: User, "read", user);

## Users can see other users in their org.
allow(user: User, "read", other: User) if
    org in user.orgs and org in other.orgs;


# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# ROLES

# XXX(gj): should there be a permission for viewing org/repo role choices?

# XXX(gj): should there be a permission for viewing the user role assignments for a particular resource?

## Org Roles

# XXX(gj): what's up with the string "org"?
resource(_type: Org, "org", actions, roles) if
    actions = ["read", "create_repo", "read_role", "create_role", "update_role", "delete_role"] and
    roles = {
        org_member: {
            perms: ["read", "read_role"],
            implies: ["repo_read"]
        },
        org_owner: {
            perms: ["create_repo", "create_role", "update_role", "delete_role"],
            implies: ["org_member", "repo_write"]
        }
    };

## Repo Roles

resource(_type: Repo, "repo", actions, roles) if
    actions = ["read", "create_issue"] and
    roles = {
        repo_write: {
            perms: ["create_issue", "issue:read"],
            implies: ["repo_read"]
        },
        repo_read: {
            perms: ["read"]
        }
    };

resource(_type: Issue, "issue", actions, _) if
    actions = ["read"];

parent(repo: Repo, parent_org: Org) if
    repo.org = parent_org;
parent(issue: Issue, parent_repo: Repo) if
    issue.repo = parent_repo;

# TODO(gj): blows up w/o `User` specializer if no current user (None / guest).
allow(actor: User, action, resource) if
    Roles.role_allows(actor, action, resource);
