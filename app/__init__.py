from flask import g, Flask, request

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User
from .fixtures import load_fixture_data

from werkzeug.exceptions import Unauthorized

from oso import Oso
from sqlalchemy_oso import authorized_sessionmaker, register_models, set_get_session
from sqlalchemy_oso.roles import enable_roles


engine = create_engine("sqlite://")
Session = sessionmaker(bind=engine)

base_oso = Oso()
AuthorizedSession = authorized_sessionmaker(
    bind=engine,
    get_oso=lambda: base_oso,
    get_user=lambda: g.current_user,
    get_action=lambda: g.current_action,
)


def create_app():
    app = Flask(__name__)

    init_oso(app)

    Base.metadata.create_all(engine)

    session = Session()
    load_fixture_data(session)

    oso = init_oso(app)

    from . import routes

    app.register_blueprint(routes.bp)

    @app.before_request
    def set_current_user_and_session():
        if "current_user" not in g:
            email = request.headers.get("user")
            if not email:
                return Unauthorized("user not found")
            try:
                # Set basic (non-auth) session for this request
                basic_session = Session()
                g.basic_session = basic_session

                # Set user for this request
                g.current_user = (
                    basic_session.query(User).filter(User.email == email).first()
                )
                # Set action for this request
                actions = {"GET": "READ", "POST": "CREATE"}
                g.current_action = actions[request.method]

                # Set auth session for this request
                g.auth_session = AuthorizedSession()

            except Exception as e:
                return Unauthorized("user not found")

    return app


def init_oso(app):
    register_models(base_oso, Base)
    set_get_session(base_oso, lambda: g.basic_session)
    base_oso.load_file("app/authorization.polar")
    app.oso = base_oso