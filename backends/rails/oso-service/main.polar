# BELONGS TO GITCLUB --------------------------
allow(actor, action, resource) if has_permission(actor, action, resource);

# Users can see each other.
has_permission(_: User, "read", _: User);

# A User can read their own profile.
has_permission(_: User{ id }, "read_profile", _: User{ id });

# Any logged-in user can create a new org.
has_permission(_: User, "create", _: Org);

actor User {}

resource Org {
  roles = ["owner", "member"];
  permissions = [
    "read",
    "create_repos",
    "list_repos",
    "create_role_assignments",
    "list_role_assignments",
    "update_role_assignments",
    "delete_role_assignments"
  ];

  "read" if "member";
  "list_repos" if "member";
  "list_role_assignments" if "member";

  "create_repos" if "owner";
  "create_role_assignments" if "owner";
  "update_role_assignments" if "owner";
  "delete_role_assignments" if "owner";

  "member" if "owner";
}

resource Repo {
  roles = ["admin", "maintainer", "reader"];
  permissions = [
    "read",
    "create_issues",
    "list_issues",
    "create_role_assignments",
    "list_role_assignments",
    "update_role_assignments",
    "delete_role_assignments"
  ];
  relations = { parent: Org };

  "create_role_assignments" if "admin";
  "list_role_assignments" if "admin";
  "update_role_assignments" if "admin";
  "delete_role_assignments" if "admin";

  "read" if "reader";
  "list_issues" if "reader";
  "create_issues" if "reader";

  "admin" if "owner" on "parent";
  "reader" if "member" on "parent";

  "maintainer" if "admin";
  "reader" if "maintainer";
}

# BELONGS TO OSO SERVICE ----------------------
has_role(actor: Actor, name: String, resource: Resource) if
  # Data.has_role(actor, name, resource);
  role in Data.getRoles(actor) and role matches { name, resource };

# type has_relation(subject: Org, predicate: String, object: Repo);
has_relation(subject: Org, "parent", object: Repo) if
  # HACK: we have to assume that object is the thing that's bound here
  relation in Data.getRelations(object) and
  relation matches { predicate: "parent", subject };