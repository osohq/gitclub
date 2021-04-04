from flask import g, Flask, request, session as flask_session

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
    app.secret_key = b"ball outside of the school"
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
        g.basic_session = session

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
        g.basic_session.close()
        g.auth_session.close()
        return res

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
