from flask import Blueprint, g, request, jsonify

from ..models import Org, Repo
from .helpers import authorize_query, authorize

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


# docs: begin-repo-index
@bp.route("", methods=["GET"])
def index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    authorize("list_repos", org)
    query = authorize_query("read", Repo)
    repos = query.filter_by(org_id=org_id)
    return jsonify([repo.repr() for repo in repos])
    # docs: end-repo-index


@bp.route("", methods=["POST"])
def create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    authorize("create_repos", org)
    repo = Repo(name=payload.get("name"), org=org)
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    authorize("read", repo)
    return repo.repr()
