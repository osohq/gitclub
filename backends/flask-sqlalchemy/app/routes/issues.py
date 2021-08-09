from flask import Blueprint, g, request, jsonify

from ..models import Repo, Issue
from .helpers import authorize_query, authorize

bp = Blueprint(
    "routes.issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    authorize("list_issues", repo)
    issues = authorize_query("read", Issue).filter_by(repo_id=repo_id)
    return jsonify([issue.repr() for issue in issues])


@bp.route("", methods=["POST"])
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    authorize("create_issues", repo)
    issue = Issue(title=payload["title"], repo=repo)
    g.session.add(issue)
    g.session.commit()
    return issue.repr(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
def show(org_id, repo_id, issue_id):
    issue = g.session.get_or_404(Issue, id=issue_id)
    authorize("read", issue)
    return issue.repr()
