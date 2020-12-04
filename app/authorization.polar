# RBAC BASE POLICY

## Top-level RBAC allow rule

### To disable the RBAC policy, simply comment out this rule
allow(user: User, action: String, resource) if
    rbac_allow(user, action, resource);

### The association between the resource roles and the requested resource is outsourced from the rbac_allow
rbac_allow(user: User, action, resource) if
    resource_role_applies_to(resource, role_resource) and
    user_in_role(user, role, role_resource) and
    print(user.email) and
    print(role.name) and
    role_allow(role, action, resource);

## Resource-role relationships

### These rules allow a roles to apply to resources other than those that they are scoped to.
### The most common example of this is nested resources, e.g. Repository roles should apply to the Issues
### nested in that repository.


### A resource's roles applies to itself
resource_role_applies_to(role_resource, role_resource);

### An organization's roles apply to its child resources (repos, teams)
resource_role_applies_to(repo: Repository, parent_org) if
    parent_org = repo.organization;

### Org roles apply to HttpRequests with paths starting /orgs/<org_id>/
resource_role_applies_to(requested_resource: Request, role_resource) if
    requested_resource.path.split("/") matches ["", "orgs", org_id, *_rest] and
    session = OsoSession.get() and
    role_resource = session.query(Organization).filter_by(id: org_id).first();

### Repo roles apply to HttpRequests with paths starting /orgs/<org_id>/repos/<repo_id>/
resource_role_applies_to(requested_resource: Request, role_resource) if
    requested_resource.path.split("/") matches ["", "orgs", _org_id, "repos", repo_id, *_rest] and
    session = OsoSession.get() and
    role_resource = session.query(Repository).filter_by(id: repo_id).first();


# USER-ROLE RELATIONSHIPS

## Organization Roles

### User role source: direct mapping between users and organization roles
user_in_role(user: User, role, org: Organization) if
    # role is an OrganizationRole object
    session = OsoSession.get() and
    role in session.query(OrganizationRole).filter(OrganizationRole.users.any(User.id.__eq__(user.id))) and
    role.organization = org;

## Repository Roles

### User role source: direct mapping between users and repository roles
user_in_role(user: User, role, repo: Repository) if
    session = OsoSession.get() and
    # role is a RepositoryRole object
    role in session.query(RepositoryRole).filter(RepositoryRole.users.any(User.id.__eq__(user.id))) and
    role.repository.id = repo.id;

# ROLE-PERMISSION RELATIONSHIPS

## Record-level Organization Permissions

### All organization roles let users read organizations
role_allow(role: OrganizationRole, "READ", org: Organization) if
    role.organization = org;

## Route-level Organization Permissions

# ### Organization owners can access the "People" org page
# role_allow(role: github::OrganizationRole{name: "Owner"}, "GET", request: HttpRequest) if
#     request.path.split("/") matches ["", "orgs", org_name, "roles", ""] and
#     # this is enforced in the `rbac_allow` rule, but checking here to be safe
#     role.organization.name = org_name;

### Organization members can access the "Teams" and "Repositories" pages within their organizations
role_allow(role: OrganizationRole{name: OrgRoles.MEMBER}, "GET", request: Request) if
    # TODO: add a method to the Role classes so that the name can go in the specializer again
    request.path.split("/") matches ["", "orgs", org_id, page] and
    page in ["teams", "repos"] and
    org_id = Integer.__str__(role.organization.id);

### Organization members can hit the route to create repositories
role_allow(role: OrganizationRole{name: OrgRoles.MEMBER}, "POST", request: Request) if
    request.path.split("/") matches ["", "orgs", org_id, "repos"] and
    org_id = Integer.__str__(role.organization.id);


## Repository Permissions

### Read role can read the repository
role_allow(role: RepositoryRole{name: RepoRoles.READ}, "READ", repo: Repository) if
    role.repository.id = repo.id;

### Organization "Read" base roles
role_allow(role: OrganizationRole{name: OrgRoles.MEMBER}, "READ", repo: Repository) if
    role.organization = repo.organization and
    repo.organization.base_repo_role = RepoRoles.READ;

### Read role can read the repository's issues
role_allow(role, "READ", issue: Issue) if
    role_allow(role, "READ", issue.repository);

## Route-level Repository Permissions

### Repository READ role access the issues index
role_allow(role: RepositoryRole{name: RepoRoles.READ}, "GET", request: Request) if
    request.path.split("/") matches ["", "orgs", org_id, "repos", repo_id, "issues"] and
    repo_id = Integer.__str__(role.repository.id);

### Repository admins can access the "Roles" repo page
role_allow(role: RepositoryRole{name: RepoRoles.ADMIN}, _action, request: Request) if
    # TODO: figure out why the specializer is working so we can kill this line
    role.name = RepoRoles.ADMIN and
    request.path.split("/") matches ["", "orgs", _org_id, "repos", repo_id, "roles"] and
    repo_id = Integer.__str__(role.repository.id);

### Organization owners can access the "Roles" repo page for all repos in the org
role_allow(role: OrganizationRole{name: OrgRoles.OWNER}, _action, request: Request) if
    # TODO: figure out why the specializer is working so we can kill this line
    role.name = OrgRoles.OWNER and
    request.path.split("/") matches ["", "orgs", _org_id, "repos", repo_id, "roles"] and
    org_id = Integer.__str__(role.organization.id);

# # ROLE-ROLE RELATIONSHIPS

# ## Role Hierarchies

# ### Grant a role permissions that it inherits from a more junior role
# role_allow(role, action, resource) if
#     inherits_role(role, inherited_role) and
#     role_allow(inherited_role, action, resource);

# ### Helper to determine relative order or roles in a list
# inherits_role_helper(role, inherited_role, role_order) if
#     ([first, *rest] = role_order and
#     role = first and
#     inherited_role in rest) or
#     ([first, *rest] = role_order and
#     inherits_role_helper(role, inherited_role, rest));

# ### Role inheritance for repository roles
# inherits_role(role: RepositoryRole, inherited_role) if
#     repository_role_order(role_order) and
#     inherits_role_helper(role.name, inherited_role_name, role_order) and
#     inherited_role = new RepositoryRole(name: inherited_role_name, repository: role.repository);

# ### Specify repository role order (most senior on left)
# repository_role_order([RepoRoles.ADMIN, RepoRoles.MAINTAIN, RepoRoles.WRITE, RepoRoles.TRIAGE, RepoRoles.READ]);


# ### Role inheritance for organization roles
# inherits_role(role: OrganizationRole, inherited_role) if
#     organization_role_order(role_order) and
#     inherits_role_helper(role.name, inherited_role_name, role_order) and
#     inherited_role = new OrganizationRole(name: inherited_role_name, organization: role.organization);

# ### Specify organization role order (most senior on left)
# organization_role_order([OrgRoles.OWNER, OrgRoles.MEMBER]);
# organization_role_order([OrgRoles.OWNER, OrgRoles.BILLING]);

# ### Role inheritance for team roles
# inherits_role(role: TeamRole, inherited_role) if
#     team_role_order(role_order) and
#     inherits_role_helper(role.name, inherited_role_name, role_order) and
#     inherited_role := new TeamRole(name: inherited_role_name, team: role.team);

# ### Specify team role order (most senior on left)
# team_role_order(["MAINTAINER", "MEMBER"]);
