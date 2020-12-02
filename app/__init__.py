from flask import g, Flask, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

from .models import db

from .authorization import init_oso
from .fixtures import load_fixture_data


def create_app():
    app = Flask(__name__)

    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI="sqlite://",
    )

    db.init_app(app)
    load_fixture_data(app, db)

    oso = init_oso(app)

    from . import routes

    app.register_blueprint(routes.bp)

    return app
