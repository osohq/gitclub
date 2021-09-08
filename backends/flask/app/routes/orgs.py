from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden

from ..models import Org, OrgRole, User
from .helpers import authorized_resource, authorized_resources, session

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
@session
def index():
    orgs = current_app.oso.authorized_resources(g.current_user, "read", Org)
    return jsonify([o.repr() for o in orgs])


@bp.route("", methods=["POST"])
@session
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    if not current_app.oso.is_allowed(g.current_user, "create", org):
        raise Forbidden

    g.session.add(org)

    org = g.session.get_or_404(Org, **payload)
    role = OrgRole(org_id=org.id, user_id=g.current_user.id, name="owner")
    g.session.add(role)
    g.session.flush()
    g.session.commit()
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
@session
def show(org_id):
    return authorized_resource("read", Org, id=org_id).repr()
