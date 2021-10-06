from flask import Blueprint, g, request, jsonify, current_app
from werkzeug.exceptions import NotFound

from ..models import Issue, Repo, User

bp = Blueprint(
    "routes.issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
def index(org_id, repo_id):
    repo = Repo.get(org_id, repo_id)
    current_app.oso.authorize(g.current_user, "list_issues", repo)
    if not repo:
        raise NotFound
    issues = g.session.query(Issue).filter_by(repo_id=repo_id)
    return jsonify([issue.repr() for issue in issues])


@bp.route("/<int:issue_id>", methods=["GET"])
def show(org_id, repo_id, issue_id):
    issue = g.session.query(Issue).filter_by(id=issue_id).one_or_none()
    current_app.oso.authorize(g.current_user, "read", issue)
    return issue.repr()
