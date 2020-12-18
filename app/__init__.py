from flask import g, Flask, request

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base, User
from .fixtures import load_fixture_data

from werkzeug.exceptions import Unauthorized

engine = create_engine("sqlite://")
Session = sessionmaker(bind=engine)


def create_app():
    app = Flask(__name__)

    Base.metadata.create_all(engine)

    session = Session()
    load_fixture_data(session)

    oso = init_oso(app)

    from . import routes

    app.register_blueprint(routes.bp)

    @app.before_request
    def set_session_and_user():
        if "current_user" not in g:
            email = request.headers.get("user")
            if not email:
                return Unauthorized("user not found")
            try:
                basic_session = Session()
                g.basic_session = basic_session
                g.current_user = (
                    basic_session.query(User).filter(User.email == email).first()
                )
            except Exception as e:
                return Unauthorized("user not found")

    return app
