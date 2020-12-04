from flask import Blueprint, g, request, current_app
from flask_oso import authorize
from .models import User, Organization, Team, Repository, Issue
from .models import RepositoryRole, OrganizationRole, TeamRole

bp = Blueprint("routes", __name__)


@bp.route("/")
def hello():
    if "current_user" in g:
        return f"hello {g.current_user}"
    else:
        return f'Please "log in"'


@bp.route("/whoami")
@authorize(resource=request)
def whoami():
    you = g.current_user
    return you.repr()


@bp.route("/orgs", methods=["GET"])
def orgs_index():
    orgs = g.auth_session.query(Organization).all()
    return {"orgs": [org.repr() for org in orgs]}


@bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
@authorize(resource=request)
def repos_index(org_id):
    repos = g.auth_session.query(Repository).filter(
        Repository.organization.has(id=org_id)
    )
    return {f"repos": [repo.repr() for repo in repos]}


@bp.route("/orgs/<int:org_id>/repos", methods=["POST"])
@authorize(resource=request)
def repos_new(org_id):
    content = request.get_json()
    print(content)
    name = content.get("name")
    org = g.basic_session.query(Organization).filter(Organization.id == org_id).first()
    repo = Repository(name=name, organization=org)
    g.basic_session.add(repo)
    return f"creating a new repo for org: {org_id}, {content['name']}"


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>", methods=["GET"])
def repos_show(org_id, repo_id):
    repo = g.basic_session.query(Repository).filter(Repository.id == repo_id).one()
    current_app.oso.authorize(repo, actor=g.current_user, action="READ")
    return {f"repo for org {org_id}": repo.repr()}


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["GET"])
@authorize(resource=request)
def issues_index(org_id, repo_id):
    issues = g.auth_session.query(Issue).filter(Issue.repository.has(id=repo_id))
    return {
        f"issues for org {org_id}, repo {repo_id}": [issue.repr() for issue in issues]
    }


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/roles", methods=["GET"])
@authorize(resource=request)
def repo_roles_index(org_id, repo_id):
    roles = g.basic_session.query(RepositoryRole).filter(
        RepositoryRole.repository.has(id=repo_id)
    )
    return {f"roles for: org {org_id}, repo {repo_id}": [role.repr() for role in roles]}


@bp.route("/orgs/<int:org_id>/teams", methods=["GET"])
@authorize(resource=request)
def teams_index(org_id):
    teams = g.basic_session.query(Team).filter(Team.organization.has(id=org_id))
    return {f"teams for org_id {org_id}": [team.repr() for team in teams]}


@bp.route("/orgs/<int:org_id>/teams/<int:team_id>", methods=["GET"])
@authorize(resource=request)
def teams_show(org_id, team_id):
    team = g.basic_session.query(Team).get(team_id)
    return team.repr()


@bp.route("/orgs/<int:org_id>/roles", methods=["GET"])
@authorize(resource=request)
def org_roles_index(org_id):
    roles = g.basic_session.query(OrganizationRole).filter(
        OrganizationRole.organization.has(id=org_id)
    )
    return {f"roles for org {org_id}": [role.repr() for role in roles]}
