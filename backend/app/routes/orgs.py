from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden

from ..models import Org
from .helpers import check_permission, session

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")

# docs: begin-org-index
@bp.route("", methods=["GET"])
@session(checked_permissions={Org: "read"})
def index():
    return jsonify([o.repr() for o in g.session.query(Org)])
    # docs: end-org-index


# docs: begin-is-allowed
@bp.route("", methods=["POST"])
@session(checked_permissions=None)
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    if not current_app.oso.is_allowed(g.current_user, "create", org):
        raise Forbidden
    # docs: end-is-allowed

    g.session.add(org)
    g.session.flush()  # NOTE(gj): load-bearing flush.
    current_app.oso.roles.assign_role(
        g.current_user, org, "org_owner", session=g.session
    )
    g.session.commit()
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
@session({Org: "read"})
def show(org_id):
    org = g.session.get_or_404(Org, id=org_id)
    return org.repr()
