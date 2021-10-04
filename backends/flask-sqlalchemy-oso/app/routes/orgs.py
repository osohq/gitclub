from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden

from ..models import Org, OrgRole
from .helpers import session

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")

@bp.route("", methods=["GET"])
@session(checked_permissions={Org: "read"})
def index():
    return jsonify([o.repr() for o in g.session.query(Org)])


@bp.route("", methods=["POST"])
@session(checked_permissions=None)
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    current_app.oso.authorize(g.current_user, "create", org, check_read=False)

    g.session.add(org)
    org = g.session.get_or_404(Org, **payload)
    role = OrgRole(org=org, user=g.current_user, name="owner")
    g.session.add(role)
    g.session.flush()  # NOTE(gj): load-bearing flush.
    g.session.commit()
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
@session({Org: "read"})
def show(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    return org.repr()
