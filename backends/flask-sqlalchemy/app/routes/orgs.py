from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden

from ..models import Org
from .helpers import authorize_query, check_permission

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")

# docs: begin-org-index
@bp.route("", methods=["GET"])
def index():
    query = authorize_query("read", Org)
    return jsonify([o.repr() for o in query])
    # docs: end-org-index


# docs: begin-is-allowed
@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    check_permission("create", org, check_read=False)
    # docs: end-is-allowed

    g.session.add(org)
    g.session.flush()  # NOTE(gj): load-bearing flush.
    current_app.oso.roles.assign_role(g.current_user, org, "owner", session=g.session)
    g.session.commit()
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    check_permission("read", org)
    return org.repr()
