from flask import Blueprint, g, request, current_app, jsonify, session as flask_session
from sqlalchemy_oso import roles as oso_roles
from sqlalchemy import column

from .models import User, Organization, Team, Repository, Issue
from .models import RepositoryRole, OrganizationRole, TeamRole

bp = Blueprint("routes", __name__)


@bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(force=True)
    if "user" not in payload:
        return {}, 400
    user = g.basic_session.query(User).filter_by(email=payload["user"]).first()
    if user is None:
        flask_session.pop("current_user_id", None)
        return {}, 401
    flask_session["current_user_id"] = user.id
    return {}


@bp.route("/whoami", methods=["GET"])
def whoami():
    return jsonify(g.current_user.repr())


@bp.route("/logout", methods=["GET"])
def logout():
    flask_session.pop("current_user_id", None)
    return {}


@bp.route("/orgs", methods=["GET"])
def orgs_index():
    orgs = g.basic_session.query(Organization).all()
    return jsonify([org.repr() for org in orgs])


@bp.route("/orgs", methods=["POST"])
def orgs_create():
    payload = request.get_json(force=True)
    org = Organization(**payload)
    oso_roles.add_user_role(g.basic_session, g.current_user, org, "OWNER", commit=True)
    # current_app.oso.authorize(org)
    g.basic_session.add(org)
    g.basic_session.commit()
    return org.repr(), 201


@bp.route("/orgs/<int:org_id>", methods=["GET"])
def orgs_show(org_id):
    org = g.basic_session.query(Organization).filter_by(id=org_id).first()
    return org.repr()


# TODO(gj): maybe in the future each org can customize its repo roles.
@bp.route("/repo_role_choices", methods=["GET"])
def repo_role_choices_index():
    return jsonify(RepositoryRole.choices)


# TODO(gj): maybe in the future each org can customize its own roles.
@bp.route("/org_role_choices", methods=["GET"])
def org_role_choices_index():
    return jsonify(OrganizationRole.choices)


@bp.route("/orgs/<int:org_id>/potential_users", methods=["GET"])
def org_potential_users_index(org_id):
    org = g.basic_session.query(Organization).filter_by(id=org_id).first()
    user_roles = oso_roles.get_resource_roles(g.basic_session, org)
    existing = [ur.user.id for ur in user_roles]
    potentials = g.basic_session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials.all()])


# @bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
# def repos_index(org_id):
#     org = g.basic_session.query(Organization).filter(Organization.id == org_id).first()
#     current_app.oso.authorize(org, actor=g.current_user, action="LIST_REPOS")
#
#     repos = g.auth_session.query(Repository).filter_by(organization=org)
#     return jsonify([repo.repr() for repo in repos])


# @bp.route("/orgs/<int:org_id>/repos", methods=["POST"])
# def repos_new(org_id):
#     # Create repo
#     repo_name = request.get_json().get("name")
#     org = g.basic_session.query(Organization).filter(Organization.id == org_id).first()
#     repo = Repository(name=repo_name, organization=org)
#
#     # Authorize repo creation + save
#     current_app.oso.authorize(repo, actor=g.current_user, action="CREATE")
#     g.basic_session.add(repo)
#     g.basic_session.commit()
#     breakpoint()  # TODO(gj): how do we get ID of newly created repo?
#     return repo.repr(), 201


# @bp.route("/orgs/<int:org_id>/repos/<int:repo_id>", methods=["GET"])
# def repos_show(org_id, repo_id):
#     # Get repo
#     repo = g.basic_session.query(Repository).filter(Repository.id == repo_id).one()
#
#     # Authorize repo access
#     current_app.oso.authorize(repo, actor=g.current_user, action="READ")
#     return repo.repr()


# @bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["GET"])
# def issues_index(org_id, repo_id):
#     repo = g.basic_session.query(Repository).filter(Repository.id == repo_id).one()
#     current_app.oso.authorize(repo, actor=g.current_user, action="LIST_ISSUES")
#
#     # Get authorized issues
#     issues = g.auth_session.query(Issue).filter(Issue.repository.has(id=repo_id))
#     return jsonify([issue.repr() for issue in issues])


# # TODO(gj): not currently using 'org_id'
# @bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/roles", methods=["GET", "POST"])
# def repo_roles_index(org_id, repo_id):
#     if request.method == "GET":
#         repo = g.basic_session.query(Repository).filter(Repository.id == repo_id).one()
#         current_app.oso.authorize(repo, actor=g.current_user, action="LIST_ROLES")
#
#         roles = oso_roles.get_resource_roles(g.auth_session, repo)
#         return jsonify(
#             [
#                 {
#                     "user": role.user.repr() if role.user else {"email": "none"},
#                     "team": role.team.repr() if role.team else {"name": "none"},
#                     "role": role.repr(),
#                 }
#                 for role in roles
#             ]
#         )
#     elif request.method == "POST":
#         # TODO: test this
#         content = request.get_json()
#         print(content)
#         role_info = content.get("role")
#         role_name = role_info.get("name")
#         user_email = role_info.get("user")
#         user = g.auth_session.query(User).filter_by(email=user_email).first()
#         repo = g.auth_session.query(Repository).filter_by(id=repo_id).first()
#         oso_roles.add_user_role(g.auth_session, user, repo, role_name, commit=True)
#         return {}, 201


# @bp.route("/orgs/<int:org_id>/teams", methods=["GET"])
# def teams_index(org_id):
#     org = g.basic_session.query(Organization).filter(Organization.id == org_id).first()
#     current_app.oso.authorize(org, actor=g.current_user, action="LIST_TEAMS")
#
#     teams = g.auth_session.query(Team).filter(Team.organization.has(id=org_id))
#     return jsonify([team.repr() for team in teams])


# @bp.route("/orgs/<int:org_id>/teams/<int:team_id>", methods=["GET"])
# def teams_show(org_id, team_id):
#     team = g.basic_session.query(Team).get(team_id)
#     current_app.oso.authorize(team, action="READ")
#     return team.repr()


# @bp.route("/orgs/<int:org_id>/billing", methods=["GET"])
# def billing_show(org_id):
#     org = g.basic_session.query(Organization).filter(Organization.id == org_id).first()
#     current_app.oso.authorize(org, actor=g.current_user, action="READ_BILLING")
#     return {"billing_address": org.billing_address}


@bp.route("/orgs/<int:org_id>/roles", methods=["GET"])
def org_roles_index(org_id):
    # Get authorized roles for this organization
    org = g.basic_session.query(Organization).filter_by(id=org_id).first()
    # current_app.oso.authorize(org, actor=g.current_user, action="LIST_ROLES")

    roles = oso_roles.get_resource_roles(g.basic_session, org)
    return jsonify([{"user": role.user.repr(), "role": role.repr()} for role in roles])


@bp.route("/orgs/<int:org_id>/roles", methods=["POST"])
def org_roles_create(org_id):
    payload = request.get_json(force=True)
    org = g.basic_session.query(Organization).filter_by(id=org_id).first()
    user = g.basic_session.query(User).filter_by(id=payload["user_id"]).first()
    oso_roles.add_user_role(g.basic_session, user, org, payload["role"], commit=True)
    # TODO(gj): it would be nice if add_user_role() returned the persisted role.
    role = oso_roles.get_user_roles(g.basic_session, user, Organization, org.id)[0]
    return {"user": role.user.repr(), "role": role.repr()}, 201
