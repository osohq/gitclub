from flask import current_app, g, request
from oso import Oso, OsoError
from oso.extras import Http
from werkzeug.exceptions import Unauthorized

from sqlalchemy.orm import Session

from .models import User, Organization, Team, Repository, Issue, db
from flask_oso import FlaskOso, authorize


base_oso = Oso()
oso = FlaskOso(base_oso)


def init_oso(app):
    @app.before_request
    def set_current_user():
        if "current_user" not in g:
            email = request.headers.get("user")
            if email:
                try:
                    g.session = Session(bind=db.engine)
                    g.current_user = (
                        g.session.query(User).filter(User.email == email).first()
                    )
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
