from flask import Blueprint, g, request, current_app, jsonify
from sqlalchemy import column
from werkzeug.exceptions import NotFound

from ..models import Org, User

from .helpers import check_permission, get_resource_by, session

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")

# docs: begin-org-index
@bp.route("", methods=["GET"])
@session(checked_permissions={Org: "read"})
def index():
    return jsonify([o.repr() for o in g.session.query(Org)])
    # docs: end-org-index


# docs: begin-is-allowed
@bp.route("", methods=["POST"])
@session()
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    check_permission("create", org)
    # docs: end-is-allowed

    g.session.add(org)
    g.session.flush()  # TODO(gj): do we still need this flush()?
    current_app.roles.assign_role(g.current_user, org, "org_owner", session=g.session)
    g.session.commit()
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
@session()
def show(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("read", org)
    return org.repr()


@bp.route("/<int:org_id>/roles", methods=["GET"])
def roles_index(org_id):
    return jsonify(current_app.roles.for_resource(Org))


@bp.route("/<int:org_id>/potential_users", methods=["GET"])
@session()
def potential_users_index(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("create_role_assignments", org)
    assignments = current_app.roles.assignments_for_resource(org)
    existing = [assignment["user_id"] for assignment in assignments]
    potentials = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials])


# docs: begin-org-role-index
@bp.route("/<int:org_id>/role_assignments", methods=["GET"])
@session()
def role_assignments_index(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("list_role_assignments", org)
    assignments = current_app.roles.assignments_for_resource(org)
    ids = [assignment["user_id"] for assignment in assignments]
    users = {u.id: u for u in g.session.query(User).filter(column("id").in_(ids))}
    assignments = [
        {"user": users[assignment["user_id"]].repr(), "role": assignment["role"]}
        for assignment in assignments
    ]
    return jsonify(assignments)
    # docs: end-org-role-index


# docs: begin-role-assignment
@bp.route("/<int:org_id>/role_assignments", methods=["POST"])
@session()
def role_assignments_create(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("create_role_assignments", org)
    user = get_resource_by(g.session, User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to assign this particular
    # role to this particular user?

    # Assign user the role in org.
    current_app.roles.assign_role(user, org, payload["role"], session=g.session)
    g.session.commit()

    return {"user": user.repr(), "role": payload["role"]}, 201
    # docs: end-role-assignment


@bp.route("/<int:org_id>/role_assignments", methods=["PATCH"])
@session()
def role_assignments_update(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("update_role_assignments", org)
    user = get_resource_by(g.session, User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to update this particular
    # user's role to this particular role?
    current_app.roles.assign_role(
        user, org, payload["role"], session=g.session, reassign=True
    )
    g.session.commit()
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/<int:org_id>/role_assignments", methods=["DELETE"])
@session()
def role_assignments_delete(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("delete_role_assignments", org)
    user = get_resource_by(g.session, User, id=payload["user_id"])
    # TODO(gj): validate that current user is allowed to delete this particular
    # user's role?
    removed = current_app.roles.remove_role(
        user, org, payload["role"], session=g.session
    )
    g.session.commit()
    if not removed:
        raise NotFound
    return current_app.response_class(status=204, mimetype="application/json")
