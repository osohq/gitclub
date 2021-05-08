from flask import Blueprint, g, request, current_app, jsonify, session as flask_session
from sqlalchemy import column
from werkzeug.exceptions import BadRequest, Forbidden, NotFound
from typing import Any, Dict, Optional, Type
import functools

from .models import Base, User, Org, Repo, Issue

bp = Blueprint("routes", __name__)

Permissions = Dict[Type[Base], str]


def session(checked_permissions: Optional[Permissions] = None):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            AuthorizedSession = current_app.authorized_sessionmaker(
                get_checked_permissions=lambda: checked_permissions,
            )
            g.session = AuthorizedSession()
            return func(*args, **kwargs)

        return wrapper

    return decorator


def check_permission(action: str, resource: Base):
    if not current_app.oso.is_allowed(g.current_user, action, resource):
        raise Forbidden


# docs: begin-get-resource-by
def get_resource_by(session, cls: Type[Any], **kwargs):
    resource = session.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource
    # docs: end-get-resource-by


@bp.errorhandler(BadRequest)
def handle_bad_request(*_):
    return {"message": "Bad Request"}, 400


@bp.errorhandler(Forbidden)
def handle_forbidden(*_):
    return {"message": "Forbidden"}, 403


@bp.errorhandler(NotFound)
def handle_not_found(*_):
    return {"message": "Not Found"}, 404


@bp.route("/session", methods=["GET"])
def whoami():
    return jsonify(g.current_user.repr() if g.current_user else None)


@bp.route("/session", methods=["POST"])
@session(checked_permissions=None)
def login():
    payload = request.get_json(force=True)
    if "email" not in payload:
        raise BadRequest
    user = g.session.query(User).filter_by(email=payload["email"]).one_or_none()
    if user is None:
        flask_session.pop("current_user_id", None)
        raise NotFound
    flask_session["current_user_id"] = user.id
    return user.repr(), 201


@bp.route("/session", methods=["DELETE"])
def logout():
    flask_session.pop("current_user_id", None)
    return current_app.response_class(status=204, mimetype="application/json")


@bp.route("/users/<int:user_id>", methods=["GET"])
@session(None)
def user_show(user_id):
    user = get_resource_by(g.session, User, id=user_id)
    check_permission("read", user)
    return user.repr()


# docs: begin-org-index
@bp.route("/orgs", methods=["GET"])
@session(checked_permissions={Org: "read"})
def org_index():
    return jsonify([o.repr() for o in g.session.query(Org)])
    # docs: end-org-index


# docs: begin-is-allowed
@bp.route("/orgs", methods=["POST"])
@session()
def org_create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    check_permission("create", org)
    # docs: end-is-allowed

    g.session.add(org)
    g.session.flush()  # TODO(gj): do we still need this flush()?
    current_app.roles.assign_role(g.current_user, org, "org_owner", session=g.session)
    g.session.commit()
    return org.repr(), 201


@bp.route("/orgs/<int:org_id>", methods=["GET"])
@session()
def org_show(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("read", org)
    return org.repr()


@bp.route("/repo_role_choices", methods=["GET"])
def repo_role_choices_index():
    return jsonify(current_app.roles.for_resource(Repo))


@bp.route("/org_role_choices", methods=["GET"])
def org_role_choices_index():
    return jsonify(current_app.roles.for_resource(Org))


@bp.route("/orgs/<int:org_id>/potential_users", methods=["GET"])
@session()
def org_potential_users_index(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("create_role_assignments", org)
    assignments = current_app.roles.assignments_for_resource(org)
    existing = [assignment["user_id"] for assignment in assignments]
    potentials = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials])


# docs: begin-repo-index
@bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
@session({Repo: "read"})
def repo_index(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("list_repos", org)
    repos = g.session.query(Repo).filter_by(org_id=org_id)
    return jsonify([repo.repr() for repo in repos])
    # docs: end-repo-index


@bp.route("/orgs/<int:org_id>/repos", methods=["POST"])
@session()
def repo_create(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("create_repos", org)
    repo = Repo(name=payload.get("name"), org=org)
    # check_permission("create", repo)  # TODO(gj): validation check; maybe unnecessary.
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/orgs/<int:_org_id>/repos/<int:repo_id>", methods=["GET"])
@session()
def repo_show(_org_id, repo_id):
    repo = get_resource_by(g.session, Repo, id=repo_id)
    check_permission("read", repo)
    return repo.repr()


@bp.route("/orgs/<int:_org_id>/repos/<int:repo_id>/issues", methods=["GET"])
@session({Issue: "read"})
def issue_index(_org_id, repo_id):
    repo = get_resource_by(g.session, Repo, id=repo_id)
    check_permission("list_issues", repo)
    issues = g.session.query(Issue).filter_by(repo_id=repo_id)
    return jsonify([issue.repr() for issue in issues])


@bp.route("/orgs/<int:_org_id>/repos/<int:repo_id>/issues", methods=["POST"])
@session()
def issue_create(_org_id, repo_id):
    payload = request.get_json(force=True)
    repo = get_resource_by(g.session, Repo, id=repo_id)
    check_permission("create_issues", repo)
    issue = Issue(title=payload["title"], repo=repo)
    # check_permission("create", issue)  # TODO(gj): validation check; maybe unnecessary.
    g.session.add(issue)
    g.session.commit()
    return issue.repr(), 201


@bp.route(
    "/orgs/<int:_org_id>/repos/<int:_repo_id>/issues/<int:issue_id>", methods=["GET"]
)
@session()
def issue_show(_org_id, _repo_id, issue_id):
    issue = get_resource_by(g.session, Issue, id=issue_id)
    check_permission("read", issue)
    return issue.repr()


# docs: begin-org-role-index
@bp.route("/orgs/<int:org_id>/role_assignments", methods=["GET"])
@session()
def org_role_assignment_index(org_id):
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
@bp.route("/orgs/<int:org_id>/role_assignments", methods=["POST"])
@session()
def org_role_assignment_create(org_id):
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


@bp.route("/orgs/<int:org_id>/role_assignments", methods=["PATCH"])
@session()
def org_role_assignment_update(org_id):
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


@bp.route("/orgs/<int:org_id>/role_assignments", methods=["DELETE"])
@session()
def org_role_assignment_delete(org_id):
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
