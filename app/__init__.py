from flask import g, Flask, request
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

    from flask_oso import authorize

    @app.route("/orgs/", methods=["GET"])
    @authorize(resource=request)
    def orgs_index():
        return "orgs"

    @app.route("/orgs/<string:org_name>/repos/", methods=["GET"])
    @authorize(resource=request)
    def repos_index(org_name):
        return f"repos for org: {org_name}"

    @app.route("/orgs/<string:org_name>/repos/", methods=["POST"])
    @authorize(resource=request)
    def repos_new(org_name):
        content = request.get_json()
        print(content)
        return f"creating a new repo for org: {org_name}, {content['name']}"

    @app.route("/orgs/<string:org_name>/repos/<string:repo_name>", methods=["GET"])
    @authorize(resource=request)
    def repos_show(org_name, repo_name):
        return f"repo for: {org_name}, {repo_name}"

    @app.route(
        "/orgs/<string:org_name>/repos/<string:repo_name>/issues/", methods=["GET"]
    )
    @authorize(resource=request)
    def issues_index(org_name, repo_name):
        return f"issues for: {org_name}, {repo_name}"

    @app.route(
        "/orgs/<string:org_name>/repos/<string:repo_name>/roles/", methods=["GET"]
    )
    @authorize(resource=request)
    def repo_roles_index(org_name, repo_name):
        return f"roles for: {org_name}, {repo_name}"

    @app.route("/orgs/<string:org_name>/teams/", methods=["GET"])
    @authorize(resource=request)
    def teams_index(org_name):
        return f"teams for org_name: {org_name}"

    @app.route("/orgs/<string:org_name>/teams/<string:team_name>", methods=["GET"])
    @authorize(resource=request)
    def teams_show(org_name, team_name):
        return f"team for org_name: {org_name}, {team_name}"

    @app.route("/orgs/<string:org_name>/people/", methods=["GET"])
    @authorize(resource=request)
    def org_people_index(org_name):
        return f"people for org_name: {org_name}"

    return app
