import functools

from flask import g, Flask, session as flask_session
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from sqlalchemy import create_engine, event, inspect
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.orm.query import Query
from sqlalchemy.orm.util import AliasedClass
from sqlalchemy.sql import expression as sql

from .models import Base, User, Org, Repo, Issue, OrgRole, RepoRole
from .fixtures import load_fixture_data

from oso import Oso, Variable

from importlib import import_module

TypeConstraint = import_module('polar.partial', 'oso').TypeConstraint

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

    # docs: begin-configure
#    app.oso.roles.synchronize_data()
    # docs: end-configure

    # optionally load fixture data
    if load_fixtures:
        load_fixture_data(Session())

    app.authorized_sessionmaker = Session


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
    oso = Oso()

    def fetcher(model):
        def constrain(query, con):
            if con.field is not None:
                field = getattr(model, con.field)
                value = con.value
            else:
                field = model.id
                value = con.value.id
                
            if con.kind == 'Eq':
                filter = field == value
            elif con.kind == 'In':
                filter = field.in_(value)
            return query.filter(filter)

        return lambda cs: reduce(constrain, cs, Session().query(model)).distinct()

    def update(model, fields):
        typ = oso.host.types[model]
        typ.build_query = fetcher(model)
        typ.fields = fields

    Relationship = import_module('polar.data_filtering', 'oso').Relationship

    def combine_query(q, r):
        return q.union(r)
    def exec_query(q):
        return q.all()

    oso.register_class(
        Repo,
        build_query=fetcher(Repo),
        exec_query=exec_query,
        combine_query=combine_query,
        types={
            'name': str,
            'org': Relationship(
                kind='parent',
                other_type='Org',
                my_field='org_id',
                other_field='id'
            ),
            'issues': Relationship(
                kind='children',
                other_type='Issue',
                my_field='id',
                other_field='repo_id'
            )
        }
    )

    oso.register_class(
        OrgRole,
        build_query=fetcher(OrgRole),
        exec_query=exec_query,
        combine_query=combine_query,
        types={
            'name': str,
            'user': Relationship(
                kind='parent',
                other_type='User',
                my_field='user_id',
                other_field='id'
            ),
            'org': Relationship(
                kind='parent',
                other_type='Org',
                my_field='org_id',
                other_field='id'
            )
        }
    )

    oso.register_class(
        RepoRole,
        build_query=fetcher(RepoRole),
        exec_query=exec_query,
        combine_query=combine_query,
        types={
            'name': str,
            'user': Relationship(
                kind='parent',
                other_type='User',
                my_field='user_id',
                other_field='id'
            ),
            'repo': Relationship(
                kind='parent',
                other_type='Repo',
                my_field='repo_id',
                other_field='id'
            )
        }
    )


    oso.register_class(
        Issue,
        build_query=fetcher(Issue),
        exec_query=exec_query,
        combine_query=combine_query,
        types={
            'title': str,
            'repo': Relationship(
                kind='parent',
                other_type='Repo',
                my_field='repo_id',
                other_field='id'
            )
        }
    )

    oso.register_class(
        Org,
        build_query=fetcher(Org),
        exec_query=exec_query,
        combine_query=combine_query,
        types={
            'name': str,
            'base_repo_role': str,
            'billing_address': str,
            'repos': Relationship(
                kind='children',
                other_type='Repo',
                my_field='id',
                other_field='org_id'
            )
        }
    )

    oso.register_class(
        User,
        build_query=fetcher(User),
        exec_query=exec_query,
        combine_query=combine_query,
        types={
            'email': str,
            'org_roles': Relationship(
                kind='children',
                other_type='OrgRole',
                my_field='id',
                other_field='user_id'
            ),
            'repo_roles': Relationship(
                kind='children',
                other_type='RepoRole',
                my_field='id',
                other_field='user_id'
            ),
        }
    )

    # Load authorization policy.
    oso.load_file("app/authorization.polar")

    # Enable roles features.
    oso.enable_roles()

    # Attach Oso instance to Flask application.
    app.oso = oso

    # docs: end-init-oso
