from flask import Blueprint, g, request, current_app, jsonify, session as flask_session
from sqlalchemy_oso import roles as oso_roles
from sqlalchemy import column

from .models import User, Organization, Repository, Issue
from . import required_action

bp = Blueprint("routes", __name__)


@bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(force=True)
    if "user" not in payload:
        return jsonify(None), 400
    user = g.session.query(User).filter_by(email=payload["user"]).first()
    if user is None:
        flask_session.pop("current_user_id", None)
        return jsonify(None), 401
    flask_session["current_user_id"] = user.id
    return user.repr()


@bp.route("/whoami", methods=["GET"])
def whoami():
    if g.current_user:
        return jsonify(g.current_user.repr())
    else:
        return jsonify(None)


@bp.route("/logout", methods=["GET"])
def logout():
    flask_session.pop("current_user_id", None)
    return {}


@bp.route("/users/<int:user_id>", methods=["GET"])
def users_show(user_id):
    user = g.session.query(User).filter_by(id=user_id).first()
    if user:
        return user.repr()
    else:
        return jsonify(None), 404


@bp.route("/orgs", methods=["GET"])
def orgs_index():
    orgs = g.session.query(Organization).all()
    return jsonify([org.repr() for org in orgs])


@bp.route("/orgs", methods=["POST"])
def orgs_create():
    payload = request.get_json(force=True)
    org = Organization(**payload)
    oso_roles.add_user_role(g.session, g.current_user, org, "OWNER", commit=True)
    g.session.add(org)
    g.session.commit()
    return org.repr(), 201


@bp.route("/orgs/<int:org_id>", methods=["GET"])
def orgs_show(org_id):
    org = g.session.query(Organization).filter_by(id=org_id).first()
    if org:
        return org.repr()
    else:
        return jsonify(None), 404


# TODO(gj): maybe in the future each org can customize its repo roles.
@bp.route("/repo_role_choices", methods=["GET"])
def repo_role_choices_index():
    return jsonify(Repository.role_definitions)


# TODO(gj): maybe in the future each org can customize its own roles.
@bp.route("/org_role_choices", methods=["GET"])
def org_role_choices_index():
    return jsonify(Organization.role_definitions)


@bp.route("/orgs/<int:org_id>/potential_users", methods=["GET"])
def org_potential_users_index(org_id):
    org = g.session.query(Organization).filter_by(id=org_id).first()
    user_roles = oso_roles.get_resource_roles(g.session, org)
    existing = [ur.user.id for ur in user_roles]
    potentials = g.session.query(User).filter(column("id").notin_(existing))
    return jsonify([p.repr() for p in potentials.all()])


@bp.route("/orgs/<int:org_id>/repos", methods=["GET"])
def repos_index(org_id):
    repos = g.auth_session.query(Repository).filter_by(organization_id=org_id)
    return jsonify([repo.repr() for repo in repos])


@bp.route("/orgs/<int:org_id>/repos", methods=["POST"])
@required_action("create_repo")
def repos_create(org_id):
    payload = request.get_json(force=True)
    # this does allow(user, "create_repo", org: Organization)
    ### Future work: skip this, make it just happen below on add
    org = g.auth_session.query(Organization).filter_by(id=org_id).first()
    if not org:
        return jsonify(None), 403
    repo = Repository(name=payload.get("name"), organization=org)

    # # Authorize repo creation + save
    # current_app.oso.authorize(repo, actor=g.current_user, action="CREATE")
    # import pdb; pdb.set_trace()

    ## TODO: would like it to call `allow(user, "create", repo)` here instead
    g.auth_session.add(repo)
    g.auth_session.commit()
    return repo.repr(), 201


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>", methods=["GET"])
def repos_show(org_id, repo_id):
    # Get repo
    repo = g.session.query(Repository).filter_by(id=repo_id).one()

    # # Authorize repo access
    # current_app.oso.authorize(repo, actor=g.current_user, action="READ")
    if repo:
        return repo.repr()
    else:
        return jsonify(None), 404


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["GET"])
def issues_index(org_id, repo_id):
    # repo = g.session.query(Repository).filter(Repository.id == repo_id).one()
    # current_app.oso.authorize(repo, actor=g.current_user, action="LIST_ISSUES")
    # current_app.oso.register_constant(g.current_user, "user")
    # current_app.oso.repl()
    issues = g.auth_session.query(Issue).filter_by(repository_id=repo_id).all()
    return jsonify([issue.repr() for issue in issues])


@bp.route("/orgs/<int:org_id>/repos/<int:repo_id>/issues", methods=["POST"])
def issues_create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.query(Repository).filter_by(id=repo_id).one()
    issue = Issue(title=payload.get("title"), repository=repo)

    # # Authorize repo creation + save
    # current_app.oso.authorize(repo, actor=g.current_user, action="CREATE")
    g.session.add(issue)
    g.session.commit()
    return issue.repr(), 201


@bp.route(
    "/orgs/<int:org_id>/repos/<int:repo_id>/issues/<int:issue_id>", methods=["GET"]
)
def issues_show(org_id, repo_id, issue_id):
    issue = g.session.query(Issue).filter_by(id=issue_id).one()
    return issue.repr()


@bp.route("/orgs/<int:org_id>/roles", methods=["GET"])
def org_roles_index(org_id):
    # Get authorized roles for this organization
    org = g.session.query(Organization).filter_by(id=org_id).first()
    # current_app.oso.authorize(org, actor=g.current_user, action="LIST_ROLES")

    roles = oso_roles.get_resource_roles(g.session, org)
    return jsonify(
        [{"user": role.user.repr(), "role": role.asdict()} for role in roles]
    )


@bp.route("/orgs/<int:org_id>/roles", methods=["POST"])
def org_roles_create(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Organization).filter_by(id=org_id).first()
    user = g.session.query(User).filter_by(id=payload["user_id"]).first()
    oso_roles.add_user_role(g.session, user, org, payload["role"], commit=True)
    # TODO(gj): it would be nice if add_user_role() returned the persisted role.
    role = oso_roles.get_user_roles(g.session, user, Organization, org.id)[0]
    return {"user": role.user.repr(), "role": role.asdict()}, 201


@bp.route("/orgs/<int:org_id>/roles", methods=["PATCH"])
def user_org_role_update(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Organization).filter_by(id=org_id).first()
    user = g.session.query(User).filter_by(id=payload["user_id"]).first()
    oso_roles.reassign_user_role(g.session, user, org, payload["role"], commit=True)
    # TODO(gj): it would be nice if reassign_user_role() returned the updated role.
    role = oso_roles.get_user_roles(g.session, user, Organization, org.id)[0]
    return {"user": role.user.repr(), "role": role.asdict()}, 200


@bp.route("/orgs/<int:org_id>/roles", methods=["DELETE"])
def user_org_role_delete(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Organization).filter_by(id=org_id).first()
    user = g.session.query(User).filter_by(id=payload["user_id"]).first()
    oso_roles.delete_user_role(g.session, user, org, payload["role"], commit=True)
    return {}, 204
