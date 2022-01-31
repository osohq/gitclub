import functools

from flask import g, Flask, session as flask_session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from sqlalchemy import create_engine, event, inspect, and_, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm.query import Query
from sqlalchemy.orm.util import AliasedClass
from sqlalchemy.sql import expression as sql

from oso_client.client import OsoClient

from .models import Base, User, Org, Repo, Issue, OrgRole, RepoRole
from .fixtures import load_fixture_data

from polar.data_filtering import Relation
from polar.data.adapter.sqlalchemy_adapter import SqlAlchemyAdapter

from typing import Any, Callable, Dict, Optional, Type

from functools import reduce

# from sqlalchemy-oso
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

    # Init session factory that SQLAlchemyOso will use to manage role data.
    Session = sessionmaker(bind=engine)

    @app.route("/_reset", methods=["POST"])
    def reset_data():
        # Called during tests to reset the database
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        load_fixture_data(Session())
        return {}

    # Init Oso.
    init_oso(app, Session)

    # Create all tables via SQLAlchemy.
    Base.metadata.create_all(engine)

    # optionally load fixture data
    if load_fixtures:
        load_fixture_data(Session())

    @app.before_request
    def set_current_user_and_session():
        flask_session.permanent = True

        g.session = Session()
        # docs: begin-authn
        if "current_user" not in g:
            if "current_user_id" in flask_session:
                user_id = flask_session.get("current_user_id")
                user = g.session.query(User).filter_by(id=user_id).one_or_none()
                if user is None:
                    flask_session.pop("current_user_id")
                g.current_user = user
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


class OsoWrapper:
    def __init__(self, oso_client, sessionmaker):
        self.client = oso_client
        self.session = sessionmaker

    def authorize(self, actor, action, resource):
        if not self.client.authorize(actor, action, resource):
            if self.client.authorize(actor, "read", resource):
                raise Forbidden
            else:
                raise NotFound

    def authorized_query(self, actor, action, resource_type):
        ids = self.client.list(actor, action, resource_type.__name__)
        return self.session().query(resource_type).filter(resource_type.id.in_(ids))

    def authorized_resources(self, actor, action, resource_type):
        return self.authorized_query(actor, action, resource_type).all()


# docs: begin-init-oso
def init_oso(app, Session: sessionmaker):
    # Initialize SQLAlchemyOso instance.
    oso = OsoWrapper(OsoClient(), Session)

    # Attach Oso instance to Flask application.
    app.oso = oso

    # docs: end-init-oso
