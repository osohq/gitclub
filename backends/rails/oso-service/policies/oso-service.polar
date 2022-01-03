# BELONGS TO OSO SERVICE
has_role(actor: Actor, name: String, resource: Resource) if
  role in resource.roles and role matches { actor, name };

# type has_relation(subject: Org, predicate: String, object: Repo);
# TODO: how to make this pass type checks if we use generic specializers here?
has_relation(subject: Org, "parent", object: Repo) if
  relation in object.relations and
  relation matches { predicate: "parent", subject };
