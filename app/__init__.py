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

    from .models import User, Organization, Team, Repository, Issue

    # todo with oso magic
    from .models import RepositoryRole, OrganizationRole, TeamRole

    with app.app_context():
        db.create_all()

        john = User(id=1, email="john@beatles.com")
        paul = User(id=2, email="paul@beatles.com")
        admin = User(id=3, email="admin@admin.com")
        mike = User(id=4, email="mike@monsters.com")
        sully = User(id=5, email="sully@monsters.com")
        ringo = User(id=6, email="ringo@beatles.com")
        randall = User(id=7, email="randall@monsters.com")
        users = [
            john,
            paul,
            admin,
            mike,
            sully,
            ringo,
            randall,
        ]
        for user in users:
            db.session.add(user)
        beatles = Organization(id=1, name="The Beatles", base_repo_role="READ")
        monsters = Organization(id=2, name="Monsters Inc.", base_repo_role="READ")
        organizations = [beatles, monsters]
        for org in organizations:
            db.session.add(org)
        vocalists = Team(id=1, name="Vocalists", organization=beatles)
        percussion = Team(id=2, name="Percussion", organization=beatles)
        scarers = Team(id=3, name="Scarers", organization=monsters)
        teams = [
            vocalists,
            percussion,
            scarers,
        ]
        for team in teams:
            db.session.add(team)
        abby_road = Repository(id=1, name="Abbey Road", organization=beatles)
        paperwork = Repository(id=2, name="Paperwork", organization=monsters)
        repositories = [
            abby_road,
            paperwork,
        ]
        for repo in repositories:
            db.session.add(repo)
        # TODO: issues
        abby_road_read = RepositoryRole(
            id=1,
            name="READ",
            repository=abby_road,
            users=[john, paul],
            teams=[vocalists],
        )
        abby_road_triage = RepositoryRole(
            id=2,
            name="TRIAGE",
            repository=abby_road,
            users=[],
            teams=[],
        )
        abby_road_write = RepositoryRole(
            id=3,
            name="WRITE",
            repository=abby_road,
            users=[],
            teams=[],
        )
        abby_road_maintain = RepositoryRole(
            id=4,
            name="MAINTAIN",
            repository=abby_road,
            users=[],
            teams=[],
        )
        abby_road_admin = RepositoryRole(
            id=5,
            name="ADMIN",
            repository=abby_road,
            users=[],
            teams=[],
        )
        paperwork_read = RepositoryRole(
            id=1,
            name="READ",
            repository=paperwork,
            users=[john, paul],
            teams=[vocalists],
        )
        paperwork_triage = RepositoryRole(
            id=2,
            name="TRIAGE",
            repository=paperwork,
            users=[],
            teams=[],
        )
        paperwork_write = RepositoryRole(
            id=3,
            name="WRITE",
            repository=paperwork,
            users=[],
            teams=[],
        )
        paperwork_maintain = RepositoryRole(
            id=4,
            name="MAINTAIN",
            repository=paperwork,
            users=[],
            teams=[],
        )
        paperwork_admin = RepositoryRole(
            id=5,
            name="ADMIN",
            repository=paperwork,
            users=[],
            teams=[],
        )

        repo_roles = [
            abby_road_read,
            abby_road_triage,
            abby_road_write,
            abby_road_maintain,
            abby_road_admin,
            paperwork_read,
            paperwork_triage,
            paperwork_write,
            paperwork_maintain,
            paperwork_admin,
        ]
        for repo_role in repo_roles:
            db.session.add(repo_role)

        db.session.commit()

    from flask_oso import authorize

    @app.route("/orgs/", methods=["GET"])
    @authorize(resource=request)
    def orgs_index():
        orgs = g.session.query(Organization).all()
        return {"orgs": [org.repr() for org in orgs]}

    @app.route("/orgs/<int:org_id>/repos/", methods=["GET"])
    @authorize(resource=request)
    def repos_index(org_id):
        repos = g.session.query(Repository).filter(
            Repository.organization.has(id=org_id)
        )
        return {f"repos for org {org_id}": [repo.repr() for repo in repos]}

    @app.route("/orgs/<int:org_id>/repos/", methods=["POST"])
    @authorize(resource=request)
    def repos_new(org_id):
        content = request.get_json()
        print(content)
        return f"creating a new repo for org: {org_id}, {content['name']}"

    @app.route("/orgs/<int:org_id>/repos/<int:repo_id>", methods=["GET"])
    @authorize(resource=request)
    def repos_show(org_id, repo_id):
        return f"repo for: {org_id}, {repo_id}"

    @app.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues/", methods=["GET"])
    @authorize(resource=request)
    def issues_index(org_id, repo_id):
        return f"issues for: {org_id}, {repo_id}"

    @app.route("/orgs/<int:org_id>/repos/<int:repo_id>/roles/", methods=["GET"])
    @authorize(resource=request)
    def repo_roles_index(org_id, repo_id):
        return f"roles for: {org_id}, {repo_id}"

    @app.route("/orgs/<int:org_id>/teams/", methods=["GET"])
    @authorize(resource=request)
    def teams_index(org_id):
        return f"teams for org_id: {org_id}"

    @app.route("/orgs/<int:org_id>/teams/<int:team_id>", methods=["GET"])
    @authorize(resource=request)
    def teams_show(org_id, team_id):
        return f"team for org_id: {org_id}, {team_id}"

    @app.route("/orgs/<int:org_id>/people/", methods=["GET"])
    @authorize(resource=request)
    def org_people_index(org_id):
        return f"people for org_id: {org_id}"

    return app
