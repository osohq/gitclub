from flask import g, current_app
from sqlalchemy.orm.session import Session
from sqlalchemy_oso.auth import authorize_model
from werkzeug.exceptions import Forbidden, NotFound
from typing import Any, Dict, Optional, Type
from sqlalchemy_oso import SQLAlchemyOso as Oso
import functools

from ..models import Base, User

Permissions = Dict[Type[Base], str]


def authorize(
    self,
    actor,
    action: str,
    resource: Base,
    *,
    check_read=True,
    forbidden_error=Forbidden,
    not_found_error=NotFound,
    read_action="read"
):
    if not self.is_allowed(actor, action, resource):
        if (
            action == read_action
            or check_read
            and not self.is_allowed(actor, read_action, resource)
        ):
            raise not_found_error
        raise forbidden_error


def authorize_query(self, actor, model: Type[Any], *, action="read"):
    filter = authorize_model(
        oso=self,
        actor=actor,
        action=action,
        session=g.session,
        model=model,
    )
    # TODO: figure out how to get session? Or return sessionless query?
    return g.session.query(model).filter(filter)


Oso.authorize = authorize
Oso.authorize_query = authorize_query


# docs: begin-get-resource-by
def get_or_404(self, cls: Type[Any], **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


Session.get_or_404 = get_or_404  # type: ignore
# docs: end-get-resource-by
