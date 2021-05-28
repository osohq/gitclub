from flask import Blueprint, g, request, jsonify

from ..models import Repo, Issue
from .helpers import session

bp = Blueprint(
    "routes.issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
@session({Repo: "list_issues", Issue: "read"})
def index(org_id, repo_id):
    repo = g.session.get_or_404(Repo, id=repo_id)
    issues = g.session.query(Issue).filter_by(repo_id=repo_id)
    return jsonify([issue.repr() for issue in issues])


@bp.route("", methods=["POST"])
@session({Repo: "create_issues", Issue: "read"})
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = g.session.get_or_404(Repo, id=repo_id)
    issue = Issue(title=payload["title"], repo=repo)
    # check_permission("create", issue)  # TODO(gj): validation check; maybe unnecessary.
    g.session.add(issue)
    g.session.commit()
    return issue.repr(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
@session({Issue: "read"})
def show(org_id, repo_id, issue_id):
    issue = g.session.get_or_404(Issue, id=issue_id)
    return issue.repr()
