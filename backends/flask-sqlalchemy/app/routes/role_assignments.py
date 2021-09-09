from flask import Blueprint, g, request, current_app, jsonify
from sqlalchemy import column
from werkzeug.exceptions import NotFound

from ..models import Org, Repo, User, OrgRole, RepoRole
from .helpers import session

bp = Blueprint("routes.role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
@session
def org_unassigned_users_index(org_id):
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", org)
    existing = [assignment.user_id for assignment in org.roles]
    unassigned = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/role_assignments", methods=["GET"])
@session
def org_index(org_id):
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", org)
    assignments = [{"user": role.user.repr(), "role": role.name} for role in org.roles]
    return jsonify(assignments)


@bp.route("/role_assignments", methods=["POST"])
@session
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "create_role_assignments", org)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = OrgRole(org_id=org.id, user_id=user.id, name=payload["role"])
    g.session.add(role)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/role_assignments", methods=["PATCH"])
@session
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "update_role_assignments", org)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = g.session.get_or_404(OrgRole, user=user, org=org)
    role.name = payload["role"]
    g.session.add(role)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/role_assignments", methods=["DELETE"])
@session
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "delete_role_assignments", org)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = g.session.get_or_404(OrgRole, user=user, org=org)
    g.session.delete(role)
    g.session.commit()
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
@session
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", repo)
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    existing = [role.user_id for role in repo.roles]

    unassigned = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
@session
def repo_index(org_id, repo_id):
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", repo)
    assignments = [{"user": role.user.repr(), "role": role.name} for role in repo.roles]
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
@session
def repo_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = RepoRole(repo_id=repo.id, user_id=user.id, name=payload["role"])
    g.session.add(role)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
@session
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "update_role_assignments", repo)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = g.session.get_or_404(RepoRole, user=user, repo=repo)
    role.name = payload["role"]
    g.session.add(role)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
@session
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "delete_role_assignments", repo)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = g.session.get_or_404(RepoRole, user=user, repo=repo)
    g.session.delete(role)
    g.session.commit()
    return current_app.response_class(status=204, mimetype="application/json")
