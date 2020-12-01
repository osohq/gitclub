from flask import g, Flask
from flask_sqlalchemy import SQLAlchemy

from .models import db
from .authorization import init_oso


def create_app():
    app = Flask(__name__)

    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI="sqlite://",
    )

    db.init_app(app)

    oso = init_oso(app)

    @app.route("/")
    def hello():
        if "current_user" in g:
            return f"hello {g.current_user}"
        else:
            return f'Please "log in"'

    from .models import User

    with app.app_context():
        print(db.create_all())

        users = [
            User(id=1, email="steve@osohq.com"),
            User(id=2, email="leina@osohq.com"),
        ]
        for user in users:
            db.session.add(user)

        db.session.commit()

    return app
