from flask import g, Flask, request

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User
from .fixtures import load_fixture_data

from flask_oso import FlaskOso
from oso import Oso
from sqlalchemy_oso import authorized_sessionmaker, register_models, set_get_session
from sqlalchemy_oso.roles import enable_roles


def create_app(db_path=None, load_fixtures=False):
    from . import routes

    # init engine and session
    if db_path:
        engine = create_engine(db_path)
    else:
        engine = create_engine("sqlite:///roles.db")
    Base.metadata.create_all(engine)

    # init app
    app = Flask(__name__)
    app.register_blueprint(routes.bp)

    # init oso
    oso = init_oso(app)

    # init sessions
    AuthorizedSession = authorized_sessionmaker(
        bind=engine,
        get_oso=lambda: oso,
        get_user=lambda: g.current_user,
        get_action=lambda: g.current_action,
    )
    Session = sessionmaker(bind=engine)
    session = Session()

    # optionally load fixture data
    if load_fixtures:
        load_fixture_data(session)

    @app.before_request
    def set_current_user_and_session():
        if "current_user" not in g:
            email = request.headers.get("user")
            if not email:
                return {}, 401
            try:
                # Set basic (non-auth) session for this request
                g.basic_session = session

                # Set user for this request
                user = session.query(User).filter(User.email == email).first()
                if user is None:
                    return {}, 401
                g.current_user = user

                # Set action for this request
                actions = {"GET": "READ", "POST": "CREATE"}
                g.current_action = actions[request.method]

                # Set auth session for this request
                g.auth_session = AuthorizedSession()

            except Exception as e:
                return {}, 401

    return app


def init_oso(app):
    base_oso = Oso()
    oso = FlaskOso(base_oso)

    register_models(base_oso, Base)
    set_get_session(base_oso, lambda: g.basic_session)
    enable_roles(base_oso)
    base_oso.load_file("app/authorization.polar")
    app.oso = oso

    return base_oso
