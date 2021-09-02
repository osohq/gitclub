from oso import OsoError
from .models import UserRole

def parse_role_name(role_name, resource_class, config, other_ok=False):
    if resource_class not in config.class_to_resource_name:
        raise OsoError(f"Unrecognized resource type {resource_class}.")
    resource_name = config.class_to_resource_name[resource_class]
    if ":" in role_name:
        namespace, _ = role_name.split(":", 1)
        if namespace not in config.resources:
            raise OsoError(f"Invalid role namespace {namespace}.")
    else:
        role_name = f"{resource_name}:{role_name}"

    return role_name

def assign_role(user, resource, role_name, session):
    role_name = parse_role_name(role_name, type(resource), self.config)
    assert ":" in role_name

    user_pk_name, _ = get_pk(user.__class__)
    user_id = getattr(user, user_pk_name)
    resource_type = resource.__class__.__name__
    resource_pk_name, _ = get_pk(resource.__class__)
    resource_id = str(getattr(resource, resource_pk_name))

    user_role = UserRole(
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        role=role_name,
    )
    session.add(user_role)
    session.flush()
