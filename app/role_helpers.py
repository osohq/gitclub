from flask import g


class OsoSession:
    @classmethod
    def get(cls):
        return g.basic_session


from .models import (
    User,
    Repository,
    Organization,
    Team,
    RepositoryRole,
    OrganizationRole,
    TeamRole,
)


def get_role_for_resource(resource_model):
    mappings = {
        Repository: RepositoryRole,
        Organization: OrganizationRole,
        Team: TeamRole,
    }

    return mappings.get(resource_model)


# Generic way to get a user's resources and roles for any resource model
def get_user_resources_and_roles(session, user, resource_model):
    """Get a user's roles for a all resources of a single resource type"""
    role_model = get_role_for_resource(resource_model)
    user_model = User
    resource_roles = (
        session.query(resource_model, role_model)
        .join(role_model)
        .filter(role_model.users.any(user_model.id == user.id))
        .all()
    )
    return resource_roles


def get_group_resources_and_roles(session, group, resource_model):
    """Get a group's roles for a all resources of a single resource type"""
    role_model = get_role_for_resource(resource_model)
    group_model = Team
    resource_roles = (
        session.query(resource_model, role_model)
        .join(role_model)
        .filter(role_model.teams.any(group_model.id == group.id))
        .all()
    )
    return resource_roles


def get_user_roles_for_resource(session, user, resource):
    """Get a user's roles for a single resource record"""
    resource_model = type(resource)
    role_model = get_role_for_resource(resource_model)
    user_model = User
    roles = (
        session.query(role_model)
        .filter(role_model.users.any(user_model.id == user.id))
        .all()
    )
    return roles


# - Get an organization's users and their roles
def get_resource_users_and_roles(session, resource):
    resource_model = type(resource)
    role_model = get_role_for_resource(resource_model)
    user_model = User
    user_roles = (
        session.query(user_model, role_model)
        .select_from(role_model)
        .join(role_model.users)
        .join(resource_model)
        .filter(resource_model.id == resource.id)
        .all()
    )
    return user_roles


# - Get all the users who have a specific role
def get_resource_users_with_role(session, resource, role_name):
    resource_model = type(resource)
    role_model = get_role_for_resource(resource_model)
    user_model = User

    users = (
        session.query(user_model)
        .select_from(role_model)
        .join(role_model.users)
        .join(resource_model)
        .filter(role_model.name == role_name, resource_model.id == resource.id)
        .all()
    )

    return users


# - Assign a user to an organization with a role
def add_user_role(session, user, resource, role_name):
    # TODO: check input for valid role name
    resource_model = type(resource)
    role_model = get_role_for_resource(resource_model)
    user_model = User

    # try to get role
    role = (
        session.query(role_model)
        .select_from(resource_model)
        .join(role_model)
        .filter(resource_model.id == resource.id)
        .filter(role_model.name == role_name)
    ).first()

    if role:
        # TODO: check if user already in role
        role.users.append(user)
    else:
        resource_name = resource_model.__name__.lower()
        kwargs = {"name": role_name, resource_name: resource, "users": [user]}

        role = role_model(**kwargs)
        session.add(role)
        session.commit()


# - Delete a user to an organization with a role
def delete_user_role(session, user, resource, role_name=None):
    resource_model = type(resource)
    role_model = get_role_for_resource(resource_model)
    user_model = User
    resource_name = resource_model.__name__.lower()
    kwargs = {"name": role_name, resource_name: resource, "users": [user]}

    role_query = (
        session.query(role_model)
        .select_from(resource_model)
        .join(role_model)
        .filter(resource_model.id == resource.id)
    )
    if role_name:
        role_query = role_query.filter(role_model.name == role_name)
    else:
        role_query = role_query.filter(role_model.users.any(user_model.id == user.id))

    roles = role_query.all()

    for role in roles:
        try:
            role.users.remove(user)
        except ValueError:
            raise Exception(
                f"User {user.email} not in role {role.name} for {resource.name}"
            )


# - Change the user's role in an organization
def reassign_user_role(session, user, resource, role_name):
    delete_user_role(session, user, resource)
    add_user_role(session, user, resource, role_name)
