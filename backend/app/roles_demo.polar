# role(resource, definitions, implies)
# organization role
role(Organization, definitions, implies) if
    definitions = {
        owner: ["create_repo"],
        member: ["WRITE"],
        guest: ["READ"]
    } and
    implies = {
        member: "guest",
        owner: "member"
    };

# repository role
role(Repository, definitions, {}) if
    definitions = {
        read: ["READ"],
        write: ["WRITE"]
    };

# relationship(parent, child, role_map) if <condition>
relationship(o: Organization, r, role_map) if
    r in o.repositories and
    r matches Repository and
    # map from org to repo roles
    role_map = {
        member: "read",
        owner: "read"
    };

