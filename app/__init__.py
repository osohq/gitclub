from flask import g, Flask, request

from datetime import datetime, timedelta

from .models import Base
from .authorization import init_oso
from .fixtures import load_fixture_data
from .db import engine, Session


def create_app():
    app = Flask(__name__)

    Base.metadata.create_all(engine)

    session = Session()
    load_fixture_data(session)

    oso = init_oso(app)

    from . import routes

    app.register_blueprint(routes.bp)

    return app
