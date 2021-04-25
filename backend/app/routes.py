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


def get_resource_by(session, cls: Type[Any], **kwargs):
    resource = session.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


@bp.route("/users/<int:user_id>", methods=["GET"])
def user_show(user_id):
    return get_resource_by(g.auth_session, User, id=user_id).repr()


@bp.route("/orgs", methods=["GET"])
def org_index():
    orgs = g.auth_session.query(Org)
    return jsonify([org.repr() for org in orgs])


@bp.route("/orgs", methods=["POST"])
def org_create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    current_app.oso.authorize(org, action="create")
    # TODO(gj): I can't use `assign_role()` without first persisting the org or
    # else the 'resource_id' field in the 'user_roles' table will be None. I
    # would prefer to make both changes as part of the same transaction so I
    # don't need to manually roll org creation back if `assign_role()` fails.
    g.basic_session.add(org)
    g.basic_session.commit()
    try:
        current_app.roles.assign_role(
            g.current_user, org, "org_owner", session=g.basic_session
        )
    except:
        g.basic_session.delete(org)
    return org.repr(), 201


@bp.route("/orgs/<int:org_id>", methods=["GET"])
def org_show(org_id):
    return get_resource_by(g.auth_session, Org, id=org_id).repr()


# TODO(gj): maybe in the future each org can customize its repo roles.
@bp.route("/repo_role_choices", methods=["GET"])
def repo_role_choices_index():
    return jsonify(["repo_read", "repo_write"])


# TODO(gj): maybe in the future each org can customize its own roles.
# TODO(gj): should folks who can't create/update/delete org roles be able to
# fetch this list?
@bp.route("/org_role_choices", methods=["GET"])
def org_role_choices_index():
    return jsonify(["org_owner", "org_member"])


@bp.route("/orgs/<int:org_id>/potential_users", methods=["GET"])
def org_potential_users_index(org_id):
    org = get_resource_by(g.auth_session, Org, id=org_id)
    # FIXME(gj): once there's an API for getting user role assignments for a
    # particular resource.
    existing = g.basic_session.execute(
        "select distinct user_id from user_roles where resource_type = 'Org' and resource_id = :resource_id;",
        {"resource_id": org_id},
    ).fetchall()
    existing = [rec[0] for rec in existing]
    potentials = g.basic_session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials])


@bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
def repo_index(org_id):
    org = get_resource_by(g.auth_session, Org, id=org_id)
    # current_app.oso.authorize(org, action="LIST_REPOS")
    repos = g.auth_session.query(Repo).filter_by(org=org)
    return jsonify([repo.repr() for repo in repos])


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
    # # TODO(gj): do we need authorize *and* auth_session? They're technically
    # # checking two different things --- whether the user is allowed to
    # # LIST_ISSUES vs. which issues the user has access to.
    # current_app.oso.authorize(repo, action="LIST_ISSUES")
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


@bp.route("/orgs/<int:org_id>/roles", methods=["GET"])
def org_role_index(org_id):
    org = get_resource_by(g.auth_session, Org, id=org_id)
    roles = g.basic_session.execute(
        """select u.*, ur.role from users u
           inner join user_roles ur on u.id = ur.user_id
           where ur.resource_type = 'Org' and ur.resource_id = :resource_id;""",
        {"resource_id": org_id},
    ).fetchall()
    roles = [{"user": {"id": r[0], "email": r[1]}, "role": r[2]} for r in roles]
    return jsonify(roles)


@bp.route("/orgs/<int:org_id>/roles", methods=["POST"])
def org_role_create(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)
    user = get_resource_by(g.basic_session, User, id=payload["user_id"])
    # TODO(gj): it would be nice if assign_role() returned the persisted role.
    current_app.roles.assign_role(user, org, payload["role"], session=g.basic_session)
    return {"user": user.repr(), "role": payload["role"]}, 201


def delete_org_role(session, org_id, user_id):
    query = """delete from user_roles
               where resource_type = 'Org' and
               resource_id = :resource_id and
               user_id = :user_id;"""
    params = {
        "resource_id": str(org_id),
        "user_id": user_id,
    }
    session.execute(query, params)


@bp.route("/orgs/<int:org_id>/roles", methods=["PATCH"])
def org_role_update(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)
    user = get_resource_by(g.basic_session, User, id=payload["user_id"])
    # TODO(gj): maybe a reassign-style method that deletes & assigns?
    delete_org_role(g.basic_session, org_id, user.id)
    # TODO(gj): it would be nice if assign_user_role() returned the updated role.
    current_app.roles.assign_role(user, org, payload["role"], session=g.basic_session)
    return {"user": user.repr(), "role": payload["role"]}


@bp.route("/orgs/<int:org_id>/roles", methods=["DELETE"])
def org_role_delete(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.auth_session, Org, id=org_id)
    user = get_resource_by(g.basic_session, User, id=payload["user_id"])
    delete_org_role(g.basic_session, org_id, user.id)
    g.basic_session.commit()
    return current_app.response_class(status=204, mimetype="application/json")
