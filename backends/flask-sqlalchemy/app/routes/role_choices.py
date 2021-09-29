from flask import Blueprint, current_app, jsonify
from oso import Variable
from ..models import Org, Repo

# FIXME omg sorry about this
from importlib import import_module

expression = import_module("polar.expression", "oso")
Expression = expression.Expression
Pattern = expression.Pattern


bp = Blueprint("routes.role_choices", __name__)


@bp.route("/org_role_choices", methods=["GET"])
def org_roles():
    return jsonify(["member", "owner"])


@bp.route("/repo_role_choices", methods=["GET"])
def repo_roles():
    return jsonify(["admin", "maintainer", "reader"])
