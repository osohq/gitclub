from flask import current_app, g, request
from oso import Oso, OsoError
from oso.extras import Http
from werkzeug.exceptions import Unauthorized

from sqlalchemy.orm import Session

from .models import User, Organization, Team, Repository, Issue, db
from flask_oso import FlaskOso, authorize
from sqlalchemy_oso import authorized_sessionmaker


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
                basic_session = Session(bind=db.engine)
                g.basic_session = basic_session
                g.current_user = (
                    basic_session.query(User).filter(User.email == email).first()
                )
                AuthorizedSession = authorized_sessionmaker(
                    bind=db.engine,
                    get_oso=lambda: base_oso,
                    get_user=lambda: g.current_user,
                    get_action=lambda: action,
                )
                g.auth_session = AuthorizedSession()
            except Exception:
                return Unauthorized("user not found")

    @app.route("/whoami")
    @authorize(resource=request)
    def whoami():
        you = g.current_user
        return you.repr()

    base_oso.register_class(User)
    base_oso.register_class(Organization)
    base_oso.register_class(Team)
    base_oso.register_class(Repository)
    base_oso.register_class(Issue)
    oso.init_app(app)

    base_oso.load_file("app/authorization.polar")

    app.oso = oso

    return oso
