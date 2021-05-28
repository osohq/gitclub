# Users can see each other.
allow(_: User, "read", _: User);

# Users can see their own profiles
allow(_: User{id: id}, "read_profile", _: User{id: id});


# docs: org-create-rule
# Any logged-in user can create a new org.
allow(_: User, "create", _: Org);

# end: org-create-rule

# ROLES

# docs: begin-org-resource
resource(_type: Org, "org", actions, roles) if
    # TODO(gj): might be able to cut down on some repetition with namespacing, e.g., `role_assignments::{create, list, update, delete}`
    actions = ["read", "create_repos", "list_repos",
               "create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"] and
    roles = {
        org_member: {
            permissions: ["read", "list_repos", "list_role_assignments"],
            implies: ["repo_read"]
        },
        org_owner: {
            permissions: ["create_repos", "create_role_assignments", "update_role_assignments", "delete_role_assignments"],
            implies: ["org_member", "repo_admin"]
        }
    };
# docs: end-org-resource

# docs: begin-repo-resource
resource(_type: Repo, "repo", actions, roles) if
    actions = ["read", "create_issues", "list_issues",
               "create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"] and
    roles = {
        repo_admin: {
            permissions: ["create_role_assignments", "list_role_assignments", "update_role_assignments", "delete_role_assignments"],
            implies: ["repo_write"]
        },
        repo_write: {
            permissions: ["create_issues"],
            implies: ["repo_read"]
        },
        repo_read: {
            permissions: ["read", "list_issues", "issue:read"]
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
