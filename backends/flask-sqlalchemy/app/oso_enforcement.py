from flask import g
from sqlalchemy_oso.auth import authorize_model
from typing import Any, Dict, Type
from sqlalchemy_oso import SQLAlchemyOso as Oso

"""
This file's contents are temporary here.
Eventually, this code would exist in the oso python library (as well as other
host language libraries).
"""

class OsoAuthorizationError(Exception):
    def __init__(self, actor, action, resource):
        self.actor = actor
        self.action = action
        self.resource = resource


class OsoNotFoundError(OsoAuthorizationError):
    pass


class OsoForbiddenError(OsoAuthorizationError):
    pass


def authorize(self, actor, action: str, resource, *, check_read=True):
    if not self.is_allowed(actor, action, resource):
        is_not_found = False
        if (
            action == self.read_action
            or check_read
            and not self.is_allowed(actor, self.read_action, resource)
        ):
            is_not_found = True
        raise self.build_error(is_not_found, actor, action, resource)


def authorize_query(self, actor, model: Type[Any]):
    filter = authorize_model(
        oso=self,
        actor=actor,
        action=self.read_action,
        session=g.session,
        model=model,
    )
    # TODO: figure out how to get session? Or return sessionless query?
    return g.session.query(model).filter(filter)


def default_build_error(self, is_not_found, actor, action, resource):
    err_class = OsoNotFoundError if is_not_found else OsoForbiddenError
    return err_class(actor, action, resource)

Oso.read_action = "read"
Oso.build_error = default_build_error
Oso.authorize = authorize
Oso.authorize_query = authorize_query
