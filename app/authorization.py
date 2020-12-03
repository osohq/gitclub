from flask import current_app, g, request
from oso import Oso, OsoError
from oso.extras import Http
from werkzeug.exceptions import Unauthorized

from sqlalchemy.orm import Session

from .db import engine, Session
from .models import Base, User, RepositoryRoleEnum, OrganizationRoleEnum

from flask_oso import FlaskOso, authorize
from sqlalchemy_oso import authorized_sessionmaker, register_models

from .role_helpers import OsoSession

base_oso = Oso()
oso = FlaskOso(base_oso)


def init_oso(app):
    @app.before_request
    def set_current_user():
        if "current_user" not in g:
            email = request.headers.get("user")
            if not email:
                return Unauthorized("user not found")
            try:
                actions = {"GET": "READ", "POST": "CREATE"}
                action = actions[request.method]
                basic_session = Session()
                g.basic_session = basic_session
                g.current_user = (
                    basic_session.query(User).filter(User.email == email).first()
                )
                AuthorizedSession = authorized_sessionmaker(
                    bind=engine,
                    get_oso=lambda: base_oso,
                    get_user=lambda: g.current_user,
                    get_action=lambda: action,
                )
                g.auth_session = AuthorizedSession()
            except Exception as e:
                return Unauthorized("user not found")

    base_oso.register_constant(OsoSession, "OsoSession")

    base_oso.register_constant(RepositoryRoleEnum, "RepoRoles")
    base_oso.register_constant(OrganizationRoleEnum, "OrgRoles")
    register_models(base_oso, Base)
    oso.init_app(app)

    base_oso.load_file("app/authorization.polar")

    app.oso = oso

    return oso
