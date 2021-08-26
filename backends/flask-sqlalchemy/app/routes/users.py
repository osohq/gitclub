from flask import Blueprint, g, jsonify, current_app

from ..models import User, Repo
from .helpers import check_permission, session

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
@session({User: "read_profile"})
def show(user_id):
    user = g.session.get_or_404(User, id=user_id)
    return user.repr()


@bp.route("/<int:user_id>/repos", methods=["GET"])
@session({User: "read_profile", Repo: "read"})
def index(user_id):
    user = g.session.get_or_404(User, id=user_id)
    # TODO use data filtering!
    repos = [
        repo.repr()
        for repo in g.session.query(Repo)
        if current_app.oso.is_allowed(user, "read", repo)
    ]
    return jsonify(repos)
