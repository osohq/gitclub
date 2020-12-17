# ALLOW RULES

### Anyone user can see any other user (TODO: fix this)
allow(user: User, _action, resource: User);

# RBAC RULES

# RESOURCE-ROLE RELATIONSHIPS

## These rules allow roles to apply to resources other than those that they are scoped to.
## The most common example of this is nested resources, e.g. Repository roles should apply to the Issues
## nested in that repository.


### An organization's roles apply to its child repositories
resource_role_applies_to(repo: Repository, parent_org) if
    parent_org := repo.organization and
    parent_org matches Organization;

### An organization's roles apply to its child teams
resource_role_applies_to(team: Team, parent_org) if
    parent_org := team.organization and
    parent_org matches Organization;

### An organization's roles apply to its child roles
resource_role_applies_to(role: OrganizationRole, parent_org) if
    parent_org := role.organization and
    parent_org matches Organization;

### A repository's roles apply to its child roles
resource_role_applies_to(role: RepositoryRole, parent_repo) if
    parent_repo = role.repository and
    parent_repo matches Repository;

### An organization's roles apply to its child repository's roles
resource_role_applies_to(role: RepositoryRole, parent_org) if
    parent_org := role.repository.organization and
    parent_org matches Organization;

### A repository's roles apply to its child issues
resource_role_applies_to(issue: Issue, parent_repo) if
    parent_repo := issue.repository;

# ROLE-PERMISSION RELATIONSHIPS

## Record-level Organization Permissions

### All organization roles let users read organizations
role_allow(role: OrganizationRole, "READ", org: Organization) if
    role.organization = org;

## OrganizationRole Permissions

### Organization owners can access the Organization's roles
role_allow(role: OrganizationRole{name: "OWNER"}, "READ", role_resource: OrganizationRole) if
    role.organization.id = role_resource.organization.id;

## Repository Permissions

### Read role can read the repository
role_allow(role: RepositoryRole{name: "READ"}, "READ", repo: Repository) if
    role.repository.id = repo.id;

### All organization members can create repositories
role_allow(role: OrganizationRole{name: "MEMBER"}, "CREATE", repository: Repository) if
    role.organization.id = repository.organization.id;

### Organization "Read" base roles
role_allow(role: OrganizationRole{name: "MEMBER"}, "READ", repo: Repository) if
    role.organization.id = repo.organization.id and
    repo.organization.base_repo_role = "READ";

### Read role can read the repository's issues
role_allow(role: RepositoryRole, "READ", issue: Issue) if
    repo := issue.repository and
    repo matches Repository and
    role_allow(role, "READ", repo);

role_allow(role: RepositoryRole{name: "READ"}, "LIST_ISSUES", repository: Repository);
role_allow(role: RepositoryRole{name: "ADMIN"}, "LIST_ROLES", repository: Repository);
role_allow(role: OrganizationRole{name: "OWNER"}, "LIST_ROLES", organization: Organization);
role_allow(role: OrganizationRole{name: "MEMBER"}, "LIST_REPOS", organization: Organization);
role_allow(role: OrganizationRole{name: "MEMBER"}, "LIST_TEAMS", organization: Organization);

## RepositoryRole Permissions

role_allow(role: RepositoryRole{name: "ADMIN"}, "READ", role_resource: RepositoryRole) if
    role.repository.id = role_resource.repository.id;

role_allow(role: OrganizationRole{name: "OWNER"}, "READ", role_resource: RepositoryRole) if
    role.organization.id = role_resource.repository.organization.id;


## Team Permissions

### Organization owners can view all teams in the org
role_allow(role: OrganizationRole{name: "OWNER"}, "READ", team: Team) if
    role.organization.id = team.organization.id;

### Team members are able to see their own teams
role_allow(role: TeamRole{name: "MEMBER"}, "READ", team: Team) if
    role.team.id = team.id;

# ROLE-ROLE RELATIONSHIPS

## Role Hierarchies

### Specify repository role order (most senior on left)
repository_role_order(["ADMIN", "MAINTAIN", "WRITE", "TRIAGE", "READ"]);

### Specify organization role order (most senior on left)
organization_role_order(["OWNER", "MEMBER"]);
organization_role_order(["OWNER", "BILLING"]);

### Specify team role order (most senior on left)
team_role_order(["MAINTAINER", "MEMBER"]);
