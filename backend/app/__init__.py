from flask import g, Flask, request, session as flask_session

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
        engine = create_engine("sqlite:///roles.db")

    # Init Flask app.
    app = Flask(__name__)
    app.secret_key = b"ball outside of the school"
    app.register_blueprint(routes.bp)

    # Init session factory that SQLAlchemyOso will use to manage role data.
    Session = sessionmaker(bind=engine)

    # Init Oso.
    init_oso(app, Session)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles2.py#L106-L107
    Base.metadata.create_all(engine)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles2.py#L110-L112
    # docs: begin-configure
    app.oso.roles.synchronize_data()
    # docs: end-configure

    # optionally load fixture data
    if load_fixtures:
        session = Session()
        load_fixture_data(session, app.oso.roles)
        session.close()

    # Init authorized session factory.
    AuthorizedSession = authorized_sessionmaker(
        bind=engine,
        get_oso=lambda: app.oso,
        get_user=lambda: g.current_user,
        get_action=lambda: g.current_action,
    )

    @app.before_request
    def set_current_user_and_session():
        flask_session.permanent = True

        # docs: begin-authn
        session = Session()
        if "current_user" not in g:
            if "current_user_id" in flask_session:
                user_id = flask_session.get("current_user_id")
                user = session.query(User).filter_by(id=user_id).one_or_none()
                if user is None:
                    flask_session.pop("current_user_id")
                g.current_user = user
            else:
                g.current_user = None

        # Set basic (non-auth) session for this request
        g.basic_session = session
        # docs: end-authn

        # Set action for this request
        if request.endpoint:
            actions = {
                "routes.org_role_index": "read_role",
                "routes.org_role_create": "create_role",
                "routes.org_role_update": "update_role",
                "routes.org_role_delete": "delete_role",
                "routes.repo_create": "create_repo",
                "routes.issue_create": "create_issue",
            }
            g.current_action = actions.get(request.endpoint, "read")
        else:
            g.current_action = None

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
