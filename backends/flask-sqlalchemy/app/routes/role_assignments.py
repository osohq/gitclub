from flask import Blueprint, g, request, current_app, jsonify
from sqlalchemy import column
from werkzeug.exceptions import NotFound

from ..models import Org, Repo, User

bp = Blueprint("routes.role_assignments", __name__, url_prefix="/orgs/<int:org_id>")


@bp.route("/unassigned_users", methods=["GET"])
def org_unassigned_users_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "read", org)
    assignments = current_app.oso.policy.roles.assignments_for_resource(org)
    existing = [assignment["user_id"] for assignment in assignments]
    user_query = current_app.oso.authorize_query(g.current_user, User)
    unassigned = user_query.filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


# docs: begin-org-role-index
@bp.route("/role_assignments", methods=["GET"])
def org_index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "list_role_assignments", org)
    # docs: begin-org-role-index-highlight
    assignments = current_app.oso.policy.roles.assignments_for_resource(org)
    # docs: end-org-role-index-highlight
    ids = [assignment["user_id"] for assignment in assignments]
    user_query = current_app.oso.authorize_query(g.current_user, User)
    users = {u.id: u for u in user_query.filter(column("id").in_(ids))}
    assignments = [
        {"user": users[assignment["user_id"]].repr(), "role": assignment["role"]}
        for assignment in assignments
    ]
    return jsonify(assignments)
    # docs: end-org-role-index


# docs: begin-role-assignment
@bp.route("/role_assignments", methods=["POST"])
def org_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "create_role_assignments", org)
    user = g.session.get_or_404(User, id=payload["user_id"])
    current_app.oso.authorize(g.current_user, "read", user)

    # Assign user the role in org.
    # docs: begin-role-assignment-highlight
    current_app.oso.policy.roles.assign_role(user, org, payload["role"])
    # docs: end-role-assignment-highlight
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201
    # docs: end-role-assignment


@bp.route("/role_assignments", methods=["PATCH"])
def org_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "update_role_assignments", org)
    user = g.session.get_or_404(User, id=payload["user_id"])
    current_app.oso.authorize(g.current_user, "read", user)
    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    current_app.oso.policy.roles.assign_role(user, org, payload["role"], reassign=True)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/role_assignments", methods=["DELETE"])
def org_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "delete_role_assignments", org)
    user = g.session.get_or_404(User, id=payload["user_id"])
    current_app.oso.authorize(g.current_user, "read", user)
    # TODO(gj): validate that current user is allowed to delete this particular
    # user's role?
    removed = current_app.oso.policy.roles.remove_role(user, org, payload["role"])
    g.session.commit()
    if not removed:
        raise NotFound
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/repos/<int:repo_id>/unassigned_users", methods=["GET"])
def repo_unassigned_users_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    assignments = current_app.oso.policy.roles.assignments_for_resource(repo)
    existing = [assignment["user_id"] for assignment in assignments]
    user_query = current_app.oso.authorize_query(g.current_user, User)
    unassigned = user_query.filter(column("id").notin_(existing))
    return jsonify([u.repr() for u in unassigned])


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["GET"])
def repo_index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "list_role_assignments", repo)
    assignments = current_app.oso.policy.roles.assignments_for_resource(repo)
    ids = [assignment["user_id"] for assignment in assignments]
    user_query = current_app.oso.authorize_query(g.current_user, User)
    users = {u.id: u for u in user_query.filter(column("id").in_(ids))}
    assignments = [
        {"user": users[assignment["user_id"]].repr(), "role": assignment["role"]}
        for assignment in assignments
    ]
    return jsonify(assignments)


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["POST"])
def repo_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "create_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])
    current_app.oso.authorize(g.current_user, "read", user)
    # TODO(gj): validate that current user is allowed to assign this particular
    # role to this particular user?

    current_app.oso.policy.roles.assign_role(user, repo, payload["role"])
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["PATCH"])
def repo_update(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "update_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])
    current_app.oso.authorize(g.current_user, "read", user)
    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    current_app.oso.policy.roles.assign_role(user, repo, payload["role"], reassign=True)
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/repos/<int:repo_id>/role_assignments", methods=["DELETE"])
def repo_delete(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "delete_role_assignments", repo)
    user = g.session.get_or_404(User, id=payload["user_id"])
    current_app.oso.authorize(g.current_user, "read", user)
    # TODO(gj): validate that current user is allowed to delete this particular
    # user's role?
    removed = current_app.oso.policy.roles.remove_role(user, repo, payload["role"])
    g.session.commit()
    if not removed:
        raise NotFound
    return current_app.response_class(status=204, mimetype="application/json")
