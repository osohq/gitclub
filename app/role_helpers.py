from flask import g


class OsoSession:
    @classmethod
    def get(cls):
        return g.basic_session


# from .models import (
#     User,
#     Repository,
#     Organization,
#     Team,
#     RepositoryRole,
#     OrganizationRole,
#     TeamRole,
# )
