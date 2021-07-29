import functools
import os

from flask import g, Flask, session as flask_session
from sqlalchemy.sql.schema import Table
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User
from .fixtures import load_fixture_data

from sqlalchemy_oso import authorized_sessionmaker, SQLAlchemyOso


def create_app(db_path=None, load_fixtures=False):
    from . import routes

    # Init DB engine.
    if db_path:
        engine = create_engine(db_path)
    else:
        engine = create_engine(
            "sqlite:///roles.db",
            # ignores errors from reusing connections across threads
            connect_args={"check_same_thread": False},
        )

    # Init Flask app.
    app = Flask(__name__)
    app.secret_key = b"ball outside of the school"
    app.register_blueprint(routes.issues.bp)
    app.register_blueprint(routes.orgs.bp)
    app.register_blueprint(routes.repos.bp)
    app.register_blueprint(routes.role_assignments.bp)
    app.register_blueprint(routes.role_choices.bp)
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

    @app.route("/_reset", methods=["POST"])
    def reset_data():
        # Called during tests to reset the database
        session = Session()
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        app.oso.roles.synchronize_data()
        load_fixture_data(session, app.oso.roles)
        return {}

    # Init session factory that SQLAlchemyOso will use to manage role data.
    Session = sessionmaker(bind=engine)

    # Init Oso.
    init_oso(app, Session)

    # Create all tables via SQLAlchemy.
    Base.metadata.create_all(engine)

    # docs: begin-configure
    app.oso.roles.synchronize_data()
    # docs: end-configure

    # optionally load fixture data
    if load_fixtures:
        load_fixture_data(Session(), app.oso.roles)

    # docs: begin-authorized-session
    # Init authorized session factory.
    app.authorized_sessionmaker = functools.partial(
        authorized_sessionmaker,
        bind=engine,
        get_oso=lambda: app.oso,
        get_user=lambda: g.current_user,
    )
    # docs: end-authorized-session

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
    # Initialize SQLAlchemyOso instance.
    oso = SQLAlchemyOso(Base)

    # Enable roles features.
    oso.enable_roles(User, Session)

    # Load authorization policy.
    oso.load_file("app/authorization.polar")

    # Attach SQLAlchemyOso instance to Flask application.
    app.oso = oso
    # docs: end-init-oso
