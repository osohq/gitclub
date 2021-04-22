# role(resource, definitions, implies)
# organization role
role(Organization, definitions, implies) if
    definitions = {
        owner: ["create_repo"],
        member: ["WRITE"],
        guest: ["READ"]
    } and
    implies = {
        # This should be a role: [list]
        member: "guest",
        owner: "member"
    };

# repository role
role(
    Repository,
    {
        guest: ["READ"],
        reader: ["READ", "Issue:READ"],
        writer: ["WRITE"]
    },
    {}
);

# user is allowed to read an issue if they have the "issues:read" permission on 
# the parent repository

# Abstractly: user is allowed to perform `action` on a `resource`
# if their role has the "{resource_class}:{action}"
# on some related resource?

# relationship(parent, child, role_map) if <condition>
relationship(o: Organization, r, role_map) if
    r in o.repositories and
    r matches Repository and
    # map from org to repo roles
    role_map = {
        member: "guest",
        owner: "reader"
    };

# relationship(parent, child, role_map) if <condition>
relationship(r: Repository, issue, {}) if
    issue in r.issues and
    issue matches Issue;