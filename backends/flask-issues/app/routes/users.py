from flask import Blueprint, g, jsonify, current_app

from ..models import Issue, User, Repo

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>/issues", methods=["GET"])
def index(user_id):
    repos = map(lambda r: r.id, filter(lambda r: "list_issues" in r.permissions, Repo.list()))
    issues = g.session.query(Issue).filter(Issue.repo_id.in_(repos)).all()
    return jsonify([issue.repr() for issue in issues])
