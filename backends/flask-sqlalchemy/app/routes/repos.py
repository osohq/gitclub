from flask import Blueprint, g, request, jsonify, current_app

from ..models import Org, Repo

bp = Blueprint("routes.repos", __name__, url_prefix="/orgs/<int:org_id>/repos")


@bp.route("", methods=["GET"])
def index(org_id):
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "list_repos", org)
    query = current_app.oso.authorized_query(g.current_user, "read", Repo)
    query = query.filter_by(org_id=org_id)
    return jsonify([repo.repr() for repo in query])


@bp.route("", methods=["POST"])
def create(org_id):
    payload = request.get_json(force=True)
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "create_repos", org)
    repo = Repo(name=payload.get("name"), org_id=org.id)
    g.session.add(repo)
    g.session.commit()
    return repo.repr(), 201


@bp.route("/<int:repo_id>", methods=["GET"])
def show(org_id, repo_id):
    repo = g.session.query(Repo).filter_by(id=repo_id).one_or_none()
    current_app.oso.authorize(g.current_user, "read", repo)
    return repo.repr()
