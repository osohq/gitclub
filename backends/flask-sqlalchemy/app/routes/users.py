from flask import Blueprint, g

from ..models import User
from .helpers import check_permission, session

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
@session({User: "read_profile"})
def show(user_id):
    user = g.session.get_or_404(User, id=user_id)
    return user.repr()
