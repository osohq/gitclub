from flask import Blueprint, g, request, current_app, jsonify, session as flask_session
from sqlalchemy import column
from werkzeug.exceptions import BadRequest, Forbidden, NotFound
from typing import Any, Type

from .models import User, Org, Repo, Issue

bp = Blueprint("routes", __name__)


@bp.errorhandler(BadRequest)
def handle_bad_request(_error):
    return {"message": "Bad Request"}, 400


@bp.errorhandler(Forbidden)
def handle_forbidden(_error):
    return {"message": "Forbidden"}, 403


@bp.errorhandler(NotFound)
def handle_not_found(_error):
    return {"message": "Not Found"}, 404


@bp.route("/session", methods=["GET"])
def whoami():
    return jsonify(g.current_user.repr() if g.current_user else None)


@bp.route("/session", methods=["POST"])
def login():
    payload = request.get_json(force=True)
    if "email" not in payload:
        raise BadRequest
    user = g.basic_session.query(User).filter_by(email=payload["email"]).one_or_none()
    if user is None:
        flask_session.pop("current_user_id", None)
        raise NotFound
    flask_session["current_user_id"] = user.id
    return user.repr(), 201


@bp.route("/session", methods=["DELETE"])
def logout():
    flask_session.pop("current_user_id", None)
    return current_app.response_class(status=204, mimetype="application/json")


# docs: begin-get-resource-by
def get_resource_by(session, cls: Type[Any], **kwargs):
    resource = session.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource
    # docs: end-get-resource-by


@bp.route("/users/<int:user_id>", methods=["GET"])
def user_show(user_id):
    return get_resource_by(g.auth_session, User, id=user_id).repr()


# docs: begin-org-index
@bp.route("/orgs", methods=["GET"])
def org_index():
    orgs = g.auth_session.query(Org)
    return jsonify([org.repr() for org in orgs])
    # docs: end-org-index


# docs: begin-is-allowed
@bp.route("/orgs", methods=["POST"])
def org_create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    if not current_app.oso.is_allowed(g.current_user, "create", org):
        raise Forbidden()
    # docs: end-is-allowed

    g.basic_session.add(org)
    g.basic_session.flush()
    current_app.oso.roles.assign_role(
        g.current_user, org, "org_owner", session=g.basic_session
    )

    g.basic_session.commit()
    return org.repr(), 201


@bp.route("/orgs/<int:org_id>", methods=["GET"])
def org_show(org_id):
    return get_resource_by(g.auth_session, Org, id=org_id).repr()


@bp.route("/repo_role_choices", methods=["GET"])
def repo_role_choices_index():
    roles = current_app.oso.roles.for_resource(Repo)
    return jsonify(roles)


@bp.route("/org_role_choices", methods=["GET"])
def org_role_choices_index():
    roles = current_app.oso.roles.for_resource(Org)
    return jsonify(roles)


@bp.route("/orgs/<int:org_id>/potential_users", methods=["GET"])
def org_potential_users_index(org_id):
    org = get_resource_by(g.auth_session, Org, id=org_id)
    assignments = current_app.oso.roles.assignments_for_resource(org)
    existing = [assignment["user_id"] for assignment in assignments]
    potentials = g.basic_session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials])


# docs: begin-repo-index
@bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
def repo_index(org_id):
    org = get_resource_by(g.auth_session, Org, id=org_id)
    repos = g.auth_session.query(Repo).filter_by(org=org)
    return jsonify([repo.repr() for repo in repos])
    # docs: end-repo-index


@bp.route("/orgs/<int:org_id>/repos", methods=["POST"])
def repo_create(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)
    g.auth_session.close()
    repo = Repo(name=payload.get("name"), org=org)
    g.basic_session.add(repo)
    g.basic_session.commit()
    return repo.repr(), 201


@bp.route("/orgs/<int:_org_id>/repos/<int:repo_id>", methods=["GET"])
def repo_show(_org_id, repo_id):
    return get_resource_by(g.auth_session, Repo, id=repo_id).repr()


@bp.route("/orgs/<int:_org_id>/repos/<int:repo_id>/issues", methods=["GET"])
def issue_index(_org_id, repo_id):
    repo = get_resource_by(g.auth_session, Repo, id=repo_id)
    issues = g.auth_session.query(Issue).filter_by(repo_id=repo_id)
    return jsonify([issue.repr() for issue in issues])


@bp.route("/orgs/<int:_org_id>/repos/<int:repo_id>/issues", methods=["POST"])
def issue_create(_org_id, repo_id):
    payload = request.get_json(force=True)
    repo = get_resource_by(g.auth_session, Repo, id=repo_id)
    g.auth_session.close()
    issue = Issue(title=payload["title"], repo=repo)
    g.basic_session.add(issue)
    g.basic_session.commit()
    return issue.repr(), 201


@bp.route(
    "/orgs/<int:_org_id>/repos/<int:_repo_id>/issues/<int:issue_id>", methods=["GET"]
)
def issues_show(_org_id, _repo_id, issue_id):
    return get_resource_by(g.auth_session, Issue, id=issue_id).repr()


# docs: begin-org-role-index
@bp.route("/orgs/<int:org_id>/roles", methods=["GET"])
def org_role_index(org_id):
    org = get_resource_by(g.auth_session, Org, id=org_id)
    assignments = current_app.oso.roles.assignments_for_resource(org)
    ids = [assignment["user_id"] for assignment in assignments]
    users = {u.id: u for u in g.basic_session.query(User).filter(column("id").in_(ids))}
    assignments = [
        {"user": users[assignment["user_id"]].repr(), "role": assignment["role"]}
        for assignment in assignments
    ]
    return jsonify(assignments)
    # docs: end-org-role-index


# docs: begin-role-assignment
@bp.route("/orgs/<int:org_id>/roles", methods=["POST"])
def org_role_create(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)

    # Use basic session since this user does not need to be authorized.
    user = get_resource_by(g.basic_session, User, id=payload["user_id"])

    # Assign user the role in org.
    current_app.oso.roles.assign_role(
        user, org, payload["role"], session=g.basic_session
    )
    g.basic_session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201
    # docs: end-role-assignment


@bp.route("/orgs/<int:org_id>/roles", methods=["PATCH"])
def org_role_update(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)
    user = get_resource_by(g.basic_session, User, id=payload["user_id"])
    current_app.oso.roles.assign_role(
        user, org, payload["role"], session=g.basic_session, reassign=True
    )
    g.basic_session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/orgs/<int:org_id>/roles", methods=["DELETE"])
def org_role_delete(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)
    user = get_resource_by(g.basic_session, User, id=payload["user_id"])
    removed = current_app.oso.roles.remove_role(
        user, org, payload["role"], session=g.basic_session
    )
    g.basic_session.commit()
    if not removed:
        raise NotFound
    return current_app.response_class(status=204, mimetype="application/json")
