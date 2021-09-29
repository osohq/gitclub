from flask import Blueprint, g, jsonify

from ..models import User, Repo
from .helpers import session

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
@session({User: "read_profile"})
def show(user_id):
    if g.current_user is None:
        user = g.session.get_or_404(User, id=user_id)
    else:
        user = g.session.get_or_403(User, id=user_id)
    return user.repr()

@bp.route("/<int:user_id>/repos", methods=["GET"])
@session({User: "read_profile", Repo: "read"})
def index(user_id):
    if g.current_user is None:
        user = g.session.get_or_404(User, id=user_id)
    else:
        user = g.session.get_or_403(User, id=user_id)
    repos = g.session.query(Repo).all()
    return jsonify([repo.repr() for repo in repos])
