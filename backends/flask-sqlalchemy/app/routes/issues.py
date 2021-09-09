from flask import Blueprint, g, request, jsonify, current_app
from werkzeug.exceptions import NotFound

from ..models import Repo, Issue
from .helpers import session, authorized_resource, authorized_resources

bp = Blueprint(
    "routes.issues",
    __name__,
    url_prefix="/orgs/<int:org_id>/repos/<int:repo_id>/issues",
)


@bp.route("", methods=["GET"])
@session
def index(org_id, repo_id):
    repo = authorized_resource("list_issues", Repo, id=repo_id)
    issues = authorized_resources("read", Issue, repo=repo)
    return jsonify([issue.repr() for issue in issues])


@bp.route("", methods=["POST"])
@session
def create(org_id, repo_id):
    payload = request.get_json(force=True)
    repo = authorized_resource("create_issues", Repo, id=repo_id)
    issue = Issue(title=payload["title"], repo_id=repo.id)
    g.session.add(issue)
    g.session.commit()
    return issue.repr(), 201


@bp.route("/<int:issue_id>", methods=["GET"])
@session
def show(org_id, repo_id, issue_id):
    ids = [
        i.id
        for i in current_app.oso.authorized_resources(g.current_user, "read", Issue)
    ]
    if issue_id not in ids:
        raise NotFound
    return authorized_resource("read", Issue, id=issue_id).repr()
