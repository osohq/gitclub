from flask import Blueprint, g
from werkzeug.exceptions import NotFound

from ..models import User
from .helpers import check_permission, session

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
@session(checked_permissions=None)
def show(user_id):
    user = g.session.get_or_404(User, id=user_id)
    check_permission("read_profile", user, error=NotFound)
    return user.repr()
