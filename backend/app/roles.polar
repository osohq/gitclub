# user is allowed to read an issue if they have the "issues:read" permission on 
# the parent repository

# Abstractly: user is allowed to perform `action` on a `resource`
# if their role has the "{resource_class}:{action}"
# on some related resource?

# allow(user, "read", issue: Issue)
allow(actor, action, resource) if
    role_allow(actor, action, resource);

role_allow(actor, action, resource) if
    # assume_role(user, {name: "member", resource: repository})
    assume_role(actor, role) and
    has_permission(role, action, resource);

# get all possible roles
assume_role(actor, role) if
    # python version
    user_role in OsoRoles.get_actor_roles(actor) and
    role_implies(user_role, role);

# role implies itself
role_implies(role, role);

# child role
role_implies(role, implied) if
    relationship(role.resource, child_resource, role_map) and
    [role.name, implied_role] in role_map and
    implied = {
        name: implied_role,
        resource: child_resource
    };


# has_permission(
#    { name: "member", resource: repository },
#    "read",
#    issue   
#)

# role directly has permission
has_permission(role, action, resource) if
    role.resource = resource and
    hack_type_check(role.resource, resource_class) and
    role_has_permission(role.name, action, resource_class);

# role has permission on parent
has_permission(role, action, resource) if
    # check that role resource and the resource are in a relationship
    relationship(role.resource, resource, _) and

    # unfortunate hacks to get the classes
    hack_type_check(role.resource, parent_resource_class) and
    hack_type_check(resource, resource_class) and

    # unfortunate hack to construct the string
    implied_permission = ":".join([resource_class.__name__, action]) and
    # check the role has the implied permission
    # TODO: make this recurse?
    role_has_permission(role.name, implied_permission, parent_resource_class);


# check for direct permission
role_has_permission(role_name, action, resource_class) if
    role(resource_class, definitions, _implies) and
    [role_name, role_perms] in definitions and
    action in role_perms;

# check for permission via implied map
role_has_permission(role_name, action, resource_class) if
    role(resource_class, _definitions, implies) and
    [role_name, implied_role] in implies and
    role_has_permission(implied_role, action, resource_class);


#### Internal hacks
hack_type_check(_: Organization, Organization);
hack_type_check(_: Repository, Repository);
hack_type_check(_: Issue, Issue);
