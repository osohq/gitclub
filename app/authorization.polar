allow(user: User, "GET", req: Request) if
    print(user.email,req);

allow(user: User, "POST", req: Request) if
    print(user.email,req);


# RBAC BASE POLICY

## Top-level RBAC allow rule

### To disable the RBAC policy, simply comment out this rule
allow(user: User, action: String, resource) if
    rbac_allow(user, action, resource);

### The association between the resource roles and the requested resource is outsourced from the rbac_allow
rbac_allow(actor: User, action, resource) if
    resource_role_applies_to(resource, role_resource) and
    user_in_role(actor, role, role_resource) and
    role_allow(role, action, resource);

## Resource-role relationships

### These rules allow a roles to apply to resources other than those that they are scoped to.
### The most common example of this is nested resources, e.g. Repository roles should apply to the Issues
### nested in that repository.


### A resource's roles applies to itself
resource_role_applies_to(role_resource, role_resource);


# USER-ROLE RELATIONSHIPS

## Organization Roles

### User role source: direct mapping between users and organization roles
user_in_role(user: User, role, org: Organization) if
    # role is an OrganizationRole object
    role in OrganizationRole.query.filter(OrganizationRole.users.any(User.id.in_([user.id]))) and
    role.organization = org;


# ROLE-PERMISSION RELATIONSHIPS

## Record-level Organization Permissions

### All organization roles let users read organizations
role_allow(role: OrganizationRole, "READ", org: Organization) if
    role.organization = org;