# Users can see themselves.
allow(user: User, "read", user: User);

# docs: org-create-rule
# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# end: org-create-rule

# ROLES

# docs: begin-org-resource
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
# docs: end-org-resource

# docs: begin-repo-resource
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
# docs: end-repo-resource

# docs: begin-issue-resource
resource(_type: Issue, "issue", actions, _) if
    actions = ["read"];

parent(issue: Issue, parent_repo: Repo) if
    issue.repo = parent_repo;
# docs: end-issue-resource

# docs: begin-repo-parent
parent(repo: Repo, parent_org: Org) if
    repo.org = parent_org;
# docs: end-repo-parent

# docs: begin-role-allow
allow(actor, action, resource) if
    Roles.role_allows(actor, action, resource);

# docs: end-role-allow
