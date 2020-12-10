# ALLOW RULES

### All users can access the orgs index
allow(user: User, "GET", resource: Request) if
    resource.path.split("/") matches ["", "orgs"];


# RBAC RULES

# RESOURCE-ROLE RELATIONSHIPS

## These rules allow roles to apply to resources other than those that they are scoped to.
## The most common example of this is nested resources, e.g. Repository roles should apply to the Issues
## nested in that repository.

### An organization's roles apply to its child repositories
resource_role_applies_to(repo: Repository, parent_org) if
    parent_org := repo.organization;

### An organization's roles apply to its child teams
resource_role_applies_to(team: Team, parent_org) if
    parent_org := team.organization;

### An organization's roles apply to its child roles
resource_role_applies_to(role: OrganizationRole, parent_org) if
    parent_org := role.organization;

### A repository's roles apply to its child roles
resource_role_applies_to(role: RepositoryRole, parent_repo) if
    parent_repo = role.repository;

## A repository's roles apply to its child issues
resource_role_applies_to(issue: Issue, parent_repo) if
    parent_repo := issue.repository;

### Org roles apply to HttpRequests with paths starting /orgs/<org_id>/
resource_role_applies_to(requested_resource: Request, parent_org) if
    requested_resource.path.split("/") matches ["", "orgs", org_id, *_rest] and
    session = OsoSession.get() and
    parent_org := session.query(Organization).filter_by(id: org_id).first();

### Repo roles apply to HttpRequests with paths starting /orgs/<org_id>/repos/<repo_id>/
resource_role_applies_to(requested_resource: Request, parent_repo) if
    requested_resource.path.split("/") matches ["", "orgs", _org_id, "repos", repo_id, *_rest] and
    session = OsoSession.get() and
    parent_repo := session.query(Repository).filter_by(id: repo_id).first();

# ROLE-PERMISSION RELATIONSHIPS

## Record-level Organization Permissions

### All organization roles let users read organizations
role_allow(role: OrganizationRole, "READ", org: Organization) if
    role.organization = org;

## Route-level Organization Permissions

### Organization owners can access the "Roles" org page
role_allow(role: OrganizationRole{name: "OWNER"}, "GET", request: Request) if
    request.path.split("/") matches ["", "orgs", org_id, "roles"] and
    org_id = Integer.__str__(role.organization.id);

### Organization members can access the "Teams" and "Repositories" pages within their organizations
role_allow(role: OrganizationRole{name: "MEMBER"}, "GET", request: Request) if
    request.path.split("/") matches ["", "orgs", org_id, page] and
    page in ["teams", "repos"] and
    org_id = Integer.__str__(role.organization.id);

## OrganizationRole Permissions

### Organization owners can access the Organization's roles
role_allow(role: OrganizationRole{name: "OWNER"}, "READ", role_resource: OrganizationRole) if
    role.organization = role_resource.organization;

## Repository Permissions

### Read role can read the repository
role_allow(role: RepositoryRole{name: "READ"}, "READ", repo: Repository) if
    role.repository.id = repo.id;

### Organization "Read" base roles
role_allow(role: OrganizationRole{name: "MEMBER"}, "READ", repo: Repository) if
    role.organization = repo.organization and
    repo.organization.base_repo_role = "READ";

### Read role can read the repository's issues
role_allow(role: RepositoryRole, "READ", issue: Issue) if
    repo = issue.repository and
    repo matches Repository and
    role_allow(role, "READ", repo);

## Route-level Repository Permissions

### Repository READ role access the issues index
role_allow(role: RepositoryRole{name: "READ"}, "GET", request: Request) if
    request.path.split("/") matches ["", "orgs", org_id, "repos", repo_id, "issues"] and
    repo_id = Integer.__str__(role.repository.id);

### Repository admins can access the "Roles" repo page
role_allow(role: RepositoryRole{name: "ADMIN"}, _action, request: Request) if
    request.path.split("/") matches ["", "orgs", _org_id, "repos", repo_id, "roles"] and
    repo_id = Integer.__str__(role.repository.id);

### Organization owners can access the "Roles" repo page for all repos in the org
role_allow(role: OrganizationRole{name: "OWNER"}, _action, request: Request) if
    request.path.split("/") matches ["", "orgs", _org_id, "repos", repo_id, "roles"] and
    org_id = Integer.__str__(role.organization.id);

### Organization members can hit the route to create repositories
role_allow(role: OrganizationRole{name: "MEMBER"}, "POST", request: Request) if
    request.path.split("/") matches ["", "orgs", org_id, "repos"] and
    org_id = Integer.__str__(role.organization.id);

## RepositoryRole Permissions

role_allow(role: OrganizationRole{name: "MEMBER"}, "CREATE", repository: Repository) if
    role.organization = repository.organization;

## Team Permissions

### Organization owners can view all teams in the org
role_allow(role: OrganizationRole{name: "OWNER"}, "READ", team: Team) if
    role.organization = team.organization;

### Team members are able to see their own teams
role_allow(role: TeamRole{name: "MEMBER"}, "READ", team: Team) if
    role.team = team;

# ROLE-ROLE RELATIONSHIPS

## Role Hierarchies

### Specify repository role order (most senior on left)
repository_role_order(["ADMIN", "MAINTAIN", "WRITE", "TRIAGE", "READ"]);

### Specify organization role order (most senior on left)
organization_role_order(["OWNER", "MEMBER"]);
organization_role_order(["OWNER", "BILLING"]);

### Specify team role order (most senior on left)
team_role_order(["MAINTAINER", "MEMBER"]);
