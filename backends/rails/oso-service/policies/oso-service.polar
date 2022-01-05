# BELONGS TO OSO SERVICE
type has_role(actor, name, resource);
has_role(actor: Actor, name: String, resource) if
  role in resource.roles and role matches { actor, name };

has_role(_: Actor, _: String, _: Resource) if false;

type has_relation(subject: Org, predicate: String, object: Repo);
# TODO: how to make this pass type checks if we use generic specializers here?
has_relation(subject: Org, "parent", object: Repo) if
  relation in object.relations and
  relation matches { predicate: "parent", subject };

# type has_relation(subject, name, object);
# has_relation(subject, predicate, object) if
#   relation in object.relations and
#   relation matches { predicate, subject };
