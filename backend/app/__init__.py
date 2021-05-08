import functools

from flask import g, Flask, session as flask_session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User
from .fixtures import load_fixture_data

from oso import Oso
from sqlalchemy_oso import authorized_sessionmaker, register_models
from sqlalchemy_oso.roles2 import OsoRoles


def create_app(db_path=None, load_fixtures=False):
    from . import routes

    # init engine
    if db_path:
        engine = create_engine(db_path)
    else:
        engine = create_engine("sqlite:///roles.db")

    # init app
    app = Flask(__name__)
    app.secret_key = b"ball outside of the school"
    app.register_blueprint(routes.issues.bp)
    app.register_blueprint(routes.orgs.bp)
    app.register_blueprint(routes.repos.bp)
    app.register_blueprint(routes.session.bp)
    app.register_blueprint(routes.users.bp)

    # Set up error handlers.
    @app.errorhandler(BadRequest)
    def handle_bad_request(*_):
        return {"message": "Bad Request"}, 400

    @app.errorhandler(Forbidden)
    def handle_forbidden(*_):
        return {"message": "Forbidden"}, 403

    @app.errorhandler(NotFound)
    def handle_not_found(*_):
        return {"message": "Not Found"}, 404

    # init basic session factory
    Session = sessionmaker(bind=engine)

    # init oso
    oso = init_oso(app, Session)

    # init authorized session factory
    app.authorized_sessionmaker = functools.partial(
        authorized_sessionmaker,
        bind=engine,
        get_oso=lambda: oso,
        get_user=lambda: g.current_user,
    )

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles2.py#L106-L107
    Base.metadata.create_all(engine)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles2.py#L110-L112
    # docs: begin-configure
    app.roles.synchronize_data()
    # docs: end-configure

    # optionally load fixture data
    if load_fixtures:
        session = Session()
        load_fixture_data(session, app.roles)
        session.close()

    @app.before_request
    def set_current_user_and_session():
        flask_session.permanent = True

        # docs: begin-authn
        if "current_user" not in g:
            if "current_user_id" in flask_session:
                user_id = flask_session.get("current_user_id")
                session = Session()
                user = session.query(User).filter_by(id=user_id).one_or_none()
                if user is None:
                    flask_session.pop("current_user_id")
                g.current_user = user
                session.close()
            else:
                g.current_user = None
        # docs: end-authn

    @app.after_request
    def add_cors_headers(res):
        res.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        res.headers.add("Access-Control-Allow-Headers", "Accept,Content-Type")
        res.headers.add("Access-Control-Allow-Methods", "DELETE,GET,OPTIONS,PATCH,POST")
        res.headers.add("Access-Control-Allow-Credentials", "true")
        return res

    @app.after_request
    def close_session(res):
        if "session" in g:
            g.session.close()
        return res

    return app


# docs: begin-init-oso
def init_oso(app, Session: sessionmaker):
    # Initialize oso instance
    oso = Oso()

    # Register authorization data
    register_models(oso, Base)
    roles = OsoRoles(oso, Base, User, Session)

    # Load authorization policy.
    oso.load_file("app/authorization.polar")

    # Attach Oso and OsoRoles instances to Flask application.
    app.oso = oso
    app.roles = roles

    return oso
    # docs: end-init-oso
