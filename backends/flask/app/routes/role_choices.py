from flask import Blueprint, current_app, jsonify
from oso import Variable
from ..models import Org, Repo

# FIXME omg sorry about this
from importlib import import_module
expression = import_module('polar.expression', 'oso')
Expression = expression.Expression
Pattern = expression.Pattern


bp = Blueprint("routes.role_choices", __name__)

# sqlalchemy-oso used to take care of this ...
# but we can recover the data from polar by querying it
def roles_for_resource(oso, re):
    roles_var = Variable('roles')
    resource = Variable('_type')
    type_name = oso.host.types[re].name
    con = Expression(
        "And", [Expression("Isa", [resource, Pattern(type_name, {})])]
    )
    res = oso.query_rule(
        'resource',
        resource,
        type_name.lower(), # hack
        Variable('_'),
        roles_var,
        bindings={ '_type': con }
    )
    
    return jsonify(list(next(iter(res))['bindings']['roles'].keys()))


@bp.route("/org_role_choices", methods=["GET"])
def org_roles():
    return roles_for_resource(current_app.oso, Org)


@bp.route("/repo_role_choices", methods=["GET"])
def repo_roles():
    return roles_for_resource(current_app.oso, Repo)
