from flask import Blueprint, g
from werkzeug.exceptions import NotFound

from ..models import User
from .helpers import authorize

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
def show(user_id):
    user = g.session.get_or_404(User, id=user_id)
    authorize("read_profile", user, error=NotFound)
    return user.repr()
