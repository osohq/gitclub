from flask import Blueprint, g, request, jsonify

from ..models import Org, Repo
from .helpers import session

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


# docs: begin-repo-index
@bp.route("", methods=["GET"])
@session({Org: "list_repos", Repo: "read"})
def index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    repos = g.session.query(Repo).filter_by(org_id=org_id)
    return jsonify([repo.repr() for repo in repos])
    # docs: end-repo-index


@bp.route("", methods=["POST"])
@session({Org: "create_repos", Repo: "read"})
def create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    repo = Repo(name=payload.get("name"), org=org)
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
@session({Repo: "read"})
def show(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    return repo.repr()
