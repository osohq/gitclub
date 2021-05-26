from flask import Blueprint, g, request, current_app, jsonify
from sqlalchemy import column
from werkzeug.exceptions import NotFound

from ..models import Org, Repo, User
from .helpers import check_permission, session

bp = Blueprint("routes.role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
@session({Org: "create_role_assignments", User: "read"})
def org_unassigned_users_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    assignments = current_app.oso.roles.assignments_for_resource(org)
    existing = [assignment["user_id"] for assignment in assignments]
    unassigned = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


# docs: begin-org-role-index
@bp.route("/role_assignments", methods=["GET"])
@session({Org: "list_role_assignments", User: "read"})
def org_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    assignments = current_app.oso.roles.assignments_for_resource(org)
    ids = [assignment["user_id"] for assignment in assignments]
    users = {u.id: u for u in g.session.query(User).filter(column("id").in_(ids))}
    assignments = [
        {"user": users[assignment["user_id"]].repr(), "role": assignment["role"]}
        for assignment in assignments
    ]
    return jsonify(assignments)
    # docs: end-org-role-index


# docs: begin-role-assignment
@bp.route("/role_assignments", methods=["POST"])
@session({Org: "create_role_assignments", User: "read"})
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    user = g.session.get_or_404(User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to assign this particular
    # role to this particular user?

    # Assign user the role in org.
    current_app.oso.roles.assign_role(user, org, payload["role"], session=g.session)
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201
    # docs: end-role-assignment


@bp.route("/role_assignments", methods=["PATCH"])
@session({Org: "update_role_assignments", User: "read"})
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    user = g.session.get_or_404(User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    current_app.oso.roles.assign_role(
        user, org, payload["role"], session=g.session, reassign=True
    )
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/role_assignments", methods=["DELETE"])
@session({Org: "delete_role_assignments", User: "read"})
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    user = g.session.get_or_404(User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to delete this particular
    # user's role?
    removed = current_app.oso.roles.remove_role(
        user, org, payload["role"], session=g.session
    )
    g.session.commit()
    if not removed:
        raise NotFound
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
@session()
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    check_permission("create_role_assignments", repo)
    assignments = current_app.oso.roles.assignments_for_resource(repo)
    existing = [assignment["user_id"] for assignment in assignments]
    unassigned = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
@session()
def repo_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    check_permission("list_role_assignments", repo)
    assignments = current_app.oso.roles.assignments_for_resource(repo)
    ids = [assignment["user_id"] for assignment in assignments]
    users = {u.id: u for u in g.session.query(User).filter(column("id").in_(ids))}
    assignments = [
        {"user": users[assignment["user_id"]].repr(), "role": assignment["role"]}
        for assignment in assignments
    ]
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
@session()
def repo_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    check_permission("create_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to assign this particular
    # role to this particular user?

    current_app.oso.roles.assign_role(user, repo, payload["role"], session=g.session)
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
@session()
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    check_permission("update_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    current_app.oso.roles.assign_role(
        user, repo, payload["role"], session=g.session, reassign=True
    )
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
@session()
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    check_permission("delete_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to delete this particular
    # user's role?
    removed = current_app.oso.roles.remove_role(
        user, repo, payload["role"], session=g.session
    )
    g.session.commit()
    if not removed:
        raise NotFound
    return current_app.response_class(status=204, mimetype="application/json")
