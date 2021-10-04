from flask import Blueprint, g, request, current_app, jsonify
from sqlalchemy import column
from werkzeug.exceptions import NotFound

from ..models import Org, Repo, User, OrgRole, RepoRole
from .helpers import session

bp = Blueprint("routes.role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
@session({Org: "list_role_assignments", User: "read", OrgRole: "read"})
def org_unassigned_users_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    existing = [role.user.id for role in org.roles]
    unassigned = g.session.query(User).filter(User.id.notin_(existing))
    return jsonify([u.repr() for u in unassigned])


# docs: begin-org-role-index
@bp.route("/role_assignments", methods=["GET"])
@session({Org: "list_role_assignments", User: "read", OrgRole: "read"})
def org_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    # docs: begin-org-role-index-highlight
    assignments = [{"user": role.user.repr(), "role": role.name} for role in org.roles]
    # docs: end-org-role-index-highlight
    return jsonify(assignments)
    # docs: end-org-role-index


# docs: begin-role-assignment
@bp.route("/role_assignments", methods=["POST"])
@session({Org: "list_role_assignments", User: "read"})
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "create_role_assignments", org)
    user = g.session.get_or_404(User, id=payload["user_id"])

    # Assign user the role in org.
    # docs: begin-role-assignment-highlight
    role = OrgRole(org=org, user=user, name=payload["role"])
    g.session.add(role)
    # docs: end-role-assignment-highlight
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201
    # docs: end-role-assignment


@bp.route("/role_assignments", methods=["PATCH"])
@session({Org: "list_role_assignments", User: "read", OrgRole: "read"})
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "update_role_assignments", org)
    user = g.session.get_or_404(User, id=payload["user_id"])
    role = g.session.get_or_404(OrgRole, user=user, org=org)
    role.name = payload["role"]
    g.session.add(role)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/role_assignments", methods=["DELETE"])
@session({Org: "list_role_assignments", User: "read", OrgRole: "read"})
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "delete_role_assignments", org)
    user = g.session.get_or_404(User, id=payload["user_id"])
    role = g.session.get_or_404(OrgRole, user=user, org=org)
    g.session.delete(role)
    g.session.commit()
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
@session({Repo: "list_role_assignments", User: "read"})
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    existing = [role.user.id for role in repo.roles]
    unassigned = g.session.query(User).filter(User.id.notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
@session({Repo: "list_role_assignments", User: "read", RepoRole: "read"})
def repo_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "list_role_assignments", repo)
    # docs: begin-org-role-index-highlight
    assignments = [{"user": role.user.repr(), "role": role.name} for role in repo.roles]
    # docs: end-org-role-index-highlight
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
@session({Repo: "list_role_assignments", User: "read"})
def repo_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])

    # TODO(gj): validate that current user is allowed to assign this particular
    # role to this particular user?
    role = RepoRole(repo=repo, user=user, name=payload["role"])
    g.session.add(role)
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
@session({Repo: "list_role_assignments", User: "read"})
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "update_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])

    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    role = g.session.get_or_404(RepoRole, user=user, org=org)
    role.name = payload["role"]
    g.session.add(role)
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
@session({Repo: "list_role_assignments", User: "read"})
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "delete_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])

    role = g.session.get_or_404(RepoRole, user=user, repo=repo)
    g.session.delete(role)
    g.session.commit()
    return current_app.response_class(status=204, mimetype="application/json")
