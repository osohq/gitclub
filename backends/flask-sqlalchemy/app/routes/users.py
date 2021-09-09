from flask import Blueprint, g, jsonify, current_app

from ..models import User, Repo
from .helpers import session, authorized_resource, authorized_resources, distinct

bp = Blueprint("routes.users", __name__, url_prefix="/users")


@bp.route("/<int:user_id>", methods=["GET"])
@session
def show(user_id):
    return authorized_resource("read_profile", User, id=user_id).repr()


@bp.route("/<int:user_id>/repos", methods=["GET"])
@session
def index(user_id):
    user = authorized_resource("read_profile", User, id=user_id)
    repos = authorized_resources("read", Repo)
    return jsonify(distinct([repo.repr() for repo in repos]))
