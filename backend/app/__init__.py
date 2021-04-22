from flask import g, Flask, request, session as flask_session
import functools
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User
from .fixtures import load_fixture_data

from oso import Oso
from sqlalchemy_oso import authorized_sessionmaker, register_models, set_get_session
from sqlalchemy_oso.roles import OsoRoles


def create_app(db_path=None, load_fixtures=False):
    from . import routes

    # init engine and session
    if db_path:
        engine = create_engine(db_path)
    else:
        engine = create_engine(
            "sqlite:///roles.db", connect_args={"check_same_thread": False}
        )

    # init app
    app = Flask(__name__)
    app.secret_key = b"ball outside of the school"
    app.register_blueprint(routes.bp)

    # init oso
    oso = init_oso(app)
    roles = OsoRoles(Base)
    oso.load_file("app/roles.polar")
    oso.load_file("app/roles_demo.polar")
    roles.enable(oso, Base, User)

    # subtlety warning - you have to call roles.enable(oso, Base, User)
    # prior to this or organization_roles doesn't get created. This is
    # particularly subtle since other things in our demos create this table
    Base.metadata.create_all(engine)

    # init sessions
    AuthorizedSession = authorized_sessionmaker(
        bind=engine,
        get_oso=lambda: oso,
        get_user=lambda: g.current_user,
        get_action=lambda: g.current_action,
    )
    Session = sessionmaker(bind=engine)

    # Runtime
    Session = sessionmaker(bind=engine)
    session = Session()
    roles.set_session(session)

    # optionally load fixture data
    if load_fixtures:
        session = Session()
        load_fixture_data(session)
        session.close()

    @app.before_request
    def set_current_user_and_session():
        flask_session.permanent = True

        session = Session()
        if "current_user" not in g:
            if "current_user_id" in flask_session:
                user_id = flask_session.get("current_user_id")
                user = session.query(User).filter(User.id == user_id).first()
                g.current_user = user
            else:
                g.current_user = None

        # Set basic (non-auth) session for this request
        g.session = session

        # Set action for this request
        actions = {"GET": "READ", "POST": "CREATE"}
        g.current_action = actions.get(request.method)

        # Set auth session for this request
        g.auth_session = AuthorizedSession()

    @app.after_request
    def add_cors_headers(res):
        res.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        res.headers.add("Access-Control-Allow-Headers", "Accept,Content-Type")
        res.headers.add("Access-Control-Allow-Methods", "DELETE,GET,OPTIONS,PATCH,POST")
        res.headers.add("Access-Control-Allow-Credentials", "true")
        return res

    @app.after_request
    def close_sessions(res):
        g.session.close()
        g.auth_session.close()
        return res

    return app


def required_action(action: str):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            g.auth_session._oso_action = action
            return func(*args, **kwargs)

        return wrapper

    return decorator


def init_oso(app):
    oso = Oso()

    register_models(oso, Base)
    set_get_session(oso, lambda: g.session)
    # oso.load_file("app/authorization.polar")
    app.oso = oso

    return oso
