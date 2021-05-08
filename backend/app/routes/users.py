from flask import Blueprint, g

from ..models import User
from .helpers import check_permission, get_resource_by, session

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
@session(None)
def show(user_id):
    user = get_resource_by(g.session, User, id=user_id)
    check_permission("read", user)
    return user.repr()
