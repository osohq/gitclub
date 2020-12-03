from flask import g
from .models import (
    User,
    Repository,
    Organization,
    Team,
    RepositoryRole,
    OrganizationRole,
    TeamRole,
)

# - Get a user's organizations (and roles in those organizations)
def get_user_organizations_and_roles(user):
    try:
        orgs = [{role: role, org: role.organization} for role in user.organization_roles]


def get_group_resources_and_roles(group, resource_type):
    pass


# - Get an organization's users and their roles
def get_resource_users_and_roles(resource, user_type):
    pass


# - Get all the users who have a specific role
def get_resource_users_with_role(resource, role_name):
    pass


# - Assign a user to an organization with a role
def add_user_role(user, resource, role_name):
    pass


# - Delete a user to an organization with a role
def delete_user_role(user, resource, role_name):
    pass


# - Change the user's role in an organization
def reassign_user_role(user, resource, role_name):
    pass
