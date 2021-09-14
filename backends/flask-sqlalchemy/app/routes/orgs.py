from flask import Blueprint, g, request, current_app, jsonify
from werkzeug.exceptions import Forbidden

from ..models import Org, OrgRole, User

bp = Blueprint("routes.orgs", __name__, url_prefix="/orgs")


@bp.route("", methods=["GET"])
def index():
    orgs = current_app.oso.authorized_resources(g.current_user, "read", Org)
    return jsonify([o.repr() for o in orgs])


@bp.route("", methods=["POST"])
def create():
    payload = request.get_json(force=True)
    org = Org(**payload)
    current_app.oso.authorize(g.current_user, "create", org, check_read=False)

    g.session.add(org)

    org = g.session.query(Org).filter_by(**payload).one_or_none()
    role = OrgRole(org_id=org.id, user_id=g.current_user.id, name="owner")
    g.session.add(role)
    g.session.flush()
    g.session.commit()
    return org.repr(), 201


@bp.route("/<int:org_id>", methods=["GET"])
def show(org_id):
    org = g.session.query(Org).filter_by(id=org_id).one_or_none()
    current_app.oso.authorize(g.current_user, "read", org)
    return org.repr()
