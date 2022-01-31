from flask import Blueprint, g, request, current_app, jsonify
from sqlalchemy import column
from werkzeug.exceptions import NotFound

from ..models import Org, Repo, User, OrgRole, RepoRole

bp = Blueprint("routes.role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
def org_unassigned_users_index(org_id):
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", org)
    roles = current_app.oso.client.get_roles(resource=org)
    existing = [role["actor_id"] for role in roles]
    unassigned = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/role_assignments", methods=["GET"])
def org_index(org_id):
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", org)

    roles = current_app.oso.client.get_roles(resource=org)

    def get_user(id):
        return g.session.query(User).filter_by(id=id).one()

    assignments = [
        {"user": get_user(role["actor_id"]).repr(), "role": role["role"]}
        for role in roles
    ]
    return jsonify(assignments)


@bp.route("/role_assignments", methods=["POST"])
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "create_role_assignments", org)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    # current_app.oso.authorize(g.current_user, "read", user)

    current_app.oso.client.add_role(org, payload["role"], user)
    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/role_assignments", methods=["PATCH"])
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "update_role_assignments", org)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    # current_app.oso.authorize(g.current_user, "read", user)

    current_roles = current_app.oso.client.get_roles(actor=user, resource=org)
    if current_roles:
        for role in current_roles:
            current_app.oso.client.delete_role(
                actor=user, role_name=role["role"], resource=org
            )
    current_app.oso.client.add_role(org, payload["role"], user)
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/role_assignments", methods=["DELETE"])
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "delete_role_assignments", org)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    # current_app.oso.authorize(g.current_user, "read", user)

    current_roles = current_app.oso.client.get_roles(actor=user, resource=org)
    if current_roles:
        for role in current_roles:
            current_app.oso.client.delete_role(
                actor=user, role_name=role["role"], resource=org
            )
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", repo)
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    existing = [role.user_id for role in repo.roles]

    unassigned = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
def repo_index(org_id, repo_id):
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_role_assignments", repo)

    roles = current_app.oso.client.get_roles(resource=repo)

    def get_user(id):
        return g.session.query(User).filter_by(id=id).one()

    assignments = [
        {"user": get_user(role["actor_id"]).repr(), "role": role["role"]}
        for role in roles
    ]
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
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
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "update_role_assignments", repo)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = g.session.query(RepoRole).filter_by(user=user, repo=repo).one_or_none()
    role.name = payload["role"]
    g.session.add(role)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "delete_role_assignments", repo)
    user = g.session.query(User).filter_by(id=payload["user_id"]).one_or_none()
    current_app.oso.authorize(g.current_user, "read", user)

    role = g.session.query(RepoRole).filter_by(user=user, repo=repo).one_or_none()
    g.session.delete(role)
    g.session.commit()
    return current_app.response_class(status=204, mimetype="application/json")
