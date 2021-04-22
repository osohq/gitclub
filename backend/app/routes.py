from flask import Blueprint, g, request, current_app, jsonify, session as flask_session
from sqlalchemy_oso import roles as oso_roles
from sqlalchemy import column
from werkzeug.exceptions import BadRequest, Forbidden, NotFound
from typing import Any, Type

from .models import User, Organization, Repository, Issue
from .models import RepositoryRole, OrganizationRole

bp = Blueprint("routes", __name__)

NoContent = {"message": "No Content"}, 204


@bp.errorhandler(BadRequest)
def handle_bad_request(_error):
    return {"message": "Bad Request"}, 400


@bp.errorhandler(Forbidden)
def handle_forbidden(_error):
    return {"message": "Forbidden"}, 403


@bp.errorhandler(NotFound)
def handle_not_found(_error):
    return {"message": "Not Found"}, 404


@bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(force=True)
    if "user" not in payload:
        raise BadRequest
    user = g.basic_session.query(User).filter_by(email=payload["user"]).one_or_none()
    if user is None:
        flask_session.pop("current_user_id", None)
        raise NotFound
    flask_session["current_user_id"] = user.id
    return user.repr()


@bp.route("/whoami", methods=["GET"])
def whoami():
    return jsonify(g.current_user.repr() if g.current_user else None)


@bp.route("/logout", methods=["GET"])
def logout():
    flask_session.pop("current_user_id", None)
    return NoContent


def get_authorized_resource_by(cls: Type[Any], **kwargs):
    resource = g.auth_session.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


@bp.route("/users/<int:user_id>", methods=["GET"])
def users_show(user_id):
    return get_authorized_resource_by(User, id=user_id).repr()


@bp.route("/orgs", methods=["GET"])
def orgs_index():
    orgs = g.auth_session.query(Organization)
    return jsonify([org.repr() for org in orgs])


@bp.route("/orgs", methods=["POST"])
def orgs_create():
    payload = request.get_json(force=True)
    org = Organization(**payload)
    current_app.oso.authorize(org, action="CREATE")
    g.basic_session.add(org)
    oso_roles.add_user_role(g.basic_session, g.current_user, org, "OWNER", commit=True)
    return org.repr(), 201


@bp.route("/orgs/<int:org_id>", methods=["GET"])
def orgs_show(org_id):
    return get_authorized_resource_by(Organization, id=org_id).repr()


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
    org = get_authorized_resource_by(Organization, id=org_id)
    user_roles = oso_roles.get_resource_roles(g.auth_session, org)
    existing = [ur.user.id for ur in user_roles]
    potentials = g.basic_session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials])


@bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
def repos_index(org_id):
    org = get_authorized_resource_by(Organization, id=org_id)
    current_app.oso.authorize(org, action="LIST_REPOS")
    repos = g.auth_session.query(Repository).filter_by(organization=org)
    return jsonify([repo.repr() for repo in repos])


@bp.route("/orgs/<int:org_id>/repos", methods=["POST"])
def repos_create(org_id):
    payload = request.get_json(force=True)
    org = get_authorized_resource_by(Organization, id=org_id)
    repo = Repository(name=payload.get("name"), organization=org)
    current_app.oso.authorize(repo, action="CREATE")
    g.basic_session.add(repo)
    g.basic_session.commit()
    return repo.repr(), 201


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>", methods=["GET"])
def repos_show(_org_id, repo_id):
    return get_authorized_resource_by(Repository, id=repo_id)


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["GET"])
def issues_index(_org_id, repo_id):
    repo = get_authorized_resource_by(Repository, id=repo_id)
    # TODO(gj): do we need authorize *and* auth_session? They're technically
    # checking two different things --- whether the user is allowed to
    # LIST_ISSUES vs. which issues the user has access to.
    current_app.oso.authorize(repo, action="LIST_ISSUES")
    issues = g.auth_session.query(Issue).filter_by(repository_id=repo_id)
    return jsonify([issue.repr() for issue in issues])


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["POST"])
def issues_create(_org_id, repo_id):
    payload = request.get_json(force=True)
    repo = get_authorized_resource_by(Repository, id=repo_id)
    issue = Issue(title=payload["title"], repository=repo)
    current_app.oso.authorize(issue, action="CREATE")
    g.basic_session.add(issue)
    g.basic_session.commit()
    return issue.repr(), 201


@bp.route(
    "/orgs/<int:org_id>/repos/<int:repo_id>/issues/<int:issue_id>", methods=["GET"]
)
def issues_show(_org_id, _repo_id, issue_id):
    return get_authorized_resource_by(Issue, id=issue_id).repr()


@bp.route("/orgs/<int:org_id>/roles", methods=["GET"])
def org_roles_index(org_id):
    org = get_authorized_resource_by(Organization, id=org_id)
    current_app.oso.authorize(org, action="LIST_ROLES")
    roles = oso_roles.get_resource_roles(g.auth_session, org)
    return jsonify([{"user": role.user.repr(), "role": role.repr()} for role in roles])


@bp.route("/orgs/<int:org_id>/roles", methods=["POST"])
def org_roles_create(org_id):
    payload = request.get_json(force=True)
    org = get_authorized_resource_by(Organization, id=org_id)
    user = get_authorized_resource_by(User, id=payload["user_id"])
    oso_roles.add_user_role(g.auth_session, user, org, payload["role"], commit=True)
    # TODO(gj): it would be nice if add_user_role() returned the persisted role.
    role = oso_roles.get_user_roles(g.auth_session, user, Organization, org.id)[0]
    return {"user": role.user.repr(), "role": role.repr()}, 201


@bp.route("/orgs/<int:org_id>/roles", methods=["PATCH"])
def user_org_role_update(org_id):
    payload = request.get_json(force=True)
    org = get_authorized_resource_by(Organization, id=org_id)
    user = get_authorized_resource_by(User, id=payload["user_id"])
    oso_roles.reassign_user_role(
        g.auth_session, user, org, payload["role"], commit=True
    )
    # TODO(gj): it would be nice if reassign_user_role() returned the updated role.
    role = oso_roles.get_user_roles(g.auth_session, user, Organization, org.id)[0]
    return {"user": role.user.repr(), "role": role.repr()}


@bp.route("/orgs/<int:org_id>/roles", methods=["DELETE"])
def user_org_role_delete(org_id):
    payload = request.get_json(force=True)
    org = get_authorized_resource_by(Organization, id=org_id)
    user = get_authorized_resource_by(User, id=payload["user_id"])
    oso_roles.delete_user_role(g.auth_session, user, org, payload["role"], commit=True)
    return NoContent
