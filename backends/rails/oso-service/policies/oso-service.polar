# BELONGS TO OSO SERVICE
has_role(actor: Actor, name: String, resource: Resource) if
  role in resource.roles and role matches { actor, name };

# type has_relation(subject: Org, predicate: String, object: Repo);
has_relation(subject: Org, "parent", object: Repo) if
  relation in object.relations and
  relation matches { predicate: "parent", subject };
