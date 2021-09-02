from flask import Blueprint, g, request, jsonify, current_app

from ..models import Org, Repo
from .helpers import authorized_resource, authorized_resources, session, distinct

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")

# docs: begin-repo-index
@bp.route("", methods=["GET"])
@session()
def index(org_id):
    org = authorized_resource("list_repos", Org, id=org_id)
    repos = authorized_resources("read", Repo)
    return jsonify(distinct([repo.repr() for repo in repos]))
    # docs: end-repo-index


@bp.route("", methods=["POST"])
@session()
def create(org_id):
    payload = request.get_json(force=True)
    org = authorized_resource("create_repos", Org, id=org_id)
    repo = Repo(name=payload.get("name"), org_id=org.id)
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
@session()
def show(org_id, repo_id):
    repo = authorized_resource("read", Repo, id=repo_id)
    return repo.repr()
