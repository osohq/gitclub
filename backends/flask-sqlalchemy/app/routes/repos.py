from flask import Blueprint, g, request, jsonify
from flask.globals import current_app

from ..models import Org, Repo
from .helpers import authorize_query, authorize

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


# docs: begin-repo-index
@bp.route("", methods=["GET"])
def index(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "list_repos", org)
    query = current_app.oso.authorize_query(g.current_user, Repo)
    repos = query.filter_by(org_id=org_id)
    return jsonify([repo.repr() for repo in repos])
    # docs: end-repo-index


@bp.route("", methods=["POST"])
def create(org_id):
    payload = request.get_json(force=True)
    org = g.session.get_or_404(Org, id=org_id)
    current_app.oso.authorize(g.current_user, "create_repos", org)
    repo = Repo(name=payload.get("name"), org=org)
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    current_app.oso.authorize(g.current_user, "read", repo)
    return repo.repr()
