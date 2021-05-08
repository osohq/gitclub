from flask import Blueprint, g, request, current_app, jsonify

from ..models import Org, Repo
from .helpers import check_permission, get_resource_by, session

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


# docs: begin-repo-index
@bp.route("", methods=["GET"])
@session({Repo: "read"})
def index(org_id):
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("list_repos", org)
    repos = g.session.query(Repo).filter_by(org_id=org_id)
    return jsonify([repo.repr() for repo in repos])
    # docs: end-repo-index


@bp.route("", methods=["POST"])
@session()
def create(org_id):
    payload = request.get_json(force=True)
    org = get_resource_by(g.session, Org, id=org_id)
    check_permission("create_repos", org)
    repo = Repo(name=payload.get("name"), org=org)
    # check_permission("create", repo)  # TODO(gj): validation check; maybe unnecessary.
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
@session()
def show(org_id, repo_id):
    repo = get_resource_by(g.session, Repo, id=repo_id)
    check_permission("read", repo)
    return repo.repr()


@bp.route("/<int:repo_id>/roles", methods=["GET"])
def roles_index(org_id, repo_id):
    return jsonify(current_app.roles.for_resource(Repo))
