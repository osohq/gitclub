from flask import g, Flask, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

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

        john = User(email="john@beatles.com")
        paul = User(email="paul@beatles.com")
        admin = User(email="admin@admin.com")
        mike = User(email="mike@monsters.com")
        sully = User(email="sully@monsters.com")
        ringo = User(email="ringo@beatles.com")
        randall = User(email="randall@monsters.com")
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
        beatles = Organization(name="The Beatles", base_repo_role="READ")
        monsters = Organization(name="Monsters Inc.", base_repo_role="READ")
        organizations = [beatles, monsters]
        for org in organizations:
            db.session.add(org)
        vocalists = Team(name="Vocalists", organization=beatles)
        percussion = Team(name="Percussion", organization=beatles)
        scarers = Team(name="Scarers", organization=monsters)
        teams = [
            vocalists,
            percussion,
            scarers,
        ]
        for team in teams:
            db.session.add(team)
        abby_road = Repository(name="Abbey Road", organization=beatles)
        paperwork = Repository(name="Paperwork", organization=monsters)
        repositories = [
            abby_road,
            paperwork,
        ]
        for repo in repositories:
            db.session.add(repo)
        # TODO: issues
        abby_road_read = RepositoryRole(
            name="READ",
            repository=abby_road,
            users=[john, paul],
            teams=[vocalists],
        )
        abby_road_triage = RepositoryRole(
            name="TRIAGE",
            repository=abby_road,
            users=[],
            teams=[],
        )
        abby_road_write = RepositoryRole(
            name="WRITE",
            repository=abby_road,
            users=[],
            teams=[],
        )
        abby_road_maintain = RepositoryRole(
            name="MAINTAIN",
            repository=abby_road,
            users=[],
            teams=[],
        )
        abby_road_admin = RepositoryRole(
            name="ADMIN",
            repository=abby_road,
            users=[],
            teams=[],
        )
        paperwork_read = RepositoryRole(
            name="READ",
            repository=paperwork,
            users=[john, paul],
            teams=[vocalists],
        )
        paperwork_triage = RepositoryRole(
            name="TRIAGE",
            repository=paperwork,
            users=[],
            teams=[],
        )
        paperwork_write = RepositoryRole(
            name="WRITE",
            repository=paperwork,
            users=[],
            teams=[],
        )
        paperwork_maintain = RepositoryRole(
            name="MAINTAIN",
            repository=paperwork,
            users=[],
            teams=[],
        )
        paperwork_admin = RepositoryRole(
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
        beatles_owner = OrganizationRole(
            name="OWNER",
            organization=beatles,
            users=[john],
        )
        beatles_member = OrganizationRole(
            name="MEMBER",
            organization=beatles,
            users=[paul, ringo],
        )
        monsters_owner = OrganizationRole(
            name="OWNER",
            organization=monsters,
            users=[mike],
        )
        monsters_member = OrganizationRole(
            name="MEMBER",
            organization=monsters,
            users=[sully, randall],
        )
        org_roles = [beatles_owner, beatles_member, monsters_owner, monsters_member]
        for org_role in org_roles:
            db.session.add(org_role)
        vocalists_member = TeamRole(name="MEMBER", team=vocalists, users=[paul])
        vocalists_maintainer = TeamRole(name="MAINTAINER", team=vocalists, users=[john])
        percussion_member = TeamRole(name="MEMBER", team=percussion, users=[])
        percussion_maintainer = TeamRole(
            name="MAINTAINER", team=percussion, users=[ringo]
        )
        scarers_member = TeamRole(name="MEMBER", team=scarers, users=[randall])
        scarers_maintainer = TeamRole(name="MAINTAINER", team=scarers, users=[sully])
        team_roles = [
            vocalists_member,
            vocalists_maintainer,
            percussion_member,
            percussion_maintainer,
            scarers_member,
            scarers_maintainer,
        ]
        for team_role in team_roles:
            db.session.add(team_role)

        db.session.commit()

    from flask_oso import authorize

    @app.route("/orgs", methods=["GET"])
    @authorize(resource=request)
    def orgs_index():
        orgs = g.basic_session.query(Organization).all()
        return {"orgs": [org.repr() for org in orgs]}

    @app.route("/orgs/<int:org_id>/repos", methods=["GET"])
    @authorize(resource=request)
    def repos_index(org_id):
        repos = g.auth_session.query(Repository).filter(
            Repository.organization.has(id=org_id)
        )
        return {f"repos for org {org_id}": [repo.repr() for repo in repos]}

    @app.route("/orgs/<int:org_id>/repos", methods=["POST"])
    @authorize(resource=request)
    def repos_new(org_id):
        content = request.get_json()
        print(content)
        name = content.get("name")
        org = (
            g.basic_session.query(Organization)
            .filter(Organization.id == org_id)
            .first()
        )
        repo = Repository(name=name, organization=org)
        g.basic_session.add(repo)
        return f"creating a new repo for org: {org_id}, {content['name']}"

    @app.route("/orgs/<int:org_id>/repos/<int:repo_id>", methods=["GET"])
    @authorize(resource=request)
    def repos_show(org_id, repo_id):
        repo = g.basic_session.query(Repository).filter(Repository.id == repo_id).one()
        return {f"repo for org {org_id}": repo.repr()}

    @app.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["GET"])
    @authorize(resource=request)
    def issues_index(org_id, repo_id):
        issues = g.basic_session.query(Issue).filter(Issue.repository.has(id=repo_id))
        return {
            f"issues for org {org_id}, repo {repo_id}": [
                issue.repr() for issue in issues
            ]
        }

    @app.route("/orgs/<int:org_id>/repos/<int:repo_id>/roles", methods=["GET"])
    @authorize(resource=request)
    def repo_roles_index(org_id, repo_id):
        roles = g.basic_session.query(RepositoryRole).filter(
            RepositoryRole.repository.has(id=repo_id)
        )
        return {
            f"roles for: org {org_id}, repo {repo_id}": [role.repr() for role in roles]
        }

    @app.route("/orgs/<int:org_id>/teams", methods=["GET"])
    @authorize(resource=request)
    def teams_index(org_id):
        teams = g.basic_session.query(Team).filter(Team.organization.has(id=org_id))
        return {f"teams for org_id {org_id}": [team.repr() for team in teams]}

    @app.route("/orgs/<int:org_id>/teams/<int:team_id>", methods=["GET"])
    @authorize(resource=request)
    def teams_show(org_id, team_id):
        team = g.basic_session.query(Team).get(team_id)
        return team.repr()

    @app.route("/orgs/<int:org_id>/roles", methods=["GET"])
    @authorize(resource=request)
    def org_roles_index(org_id):
        roles = g.basic_session.query(OrganizationRole).filter(
            OrganizationRole.organization.has(id=org_id)
        )
        return {f"roles for org {org_id}": [role.repr() for role in roles]}

    return app
