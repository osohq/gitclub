from flask import g, current_app
from sqlalchemy.orm.session import Session
from sqlalchemy_oso.auth import authorize_model
from werkzeug.exceptions import Forbidden, NotFound
from typing import Any, Dict, Optional, Type
import functools

from ..models import Base

Permissions = Dict[Type[Base], str]


def check_permission(action: str, resource: Base, check_read=True, error=Forbidden):
    if not current_app.oso.is_allowed(g.current_user, action, resource):
        if action == "read" or check_read and not current_app.oso.is_allowed(g.current_user, "read", resource):
            raise NotFound
        raise error


def authorize_query(action: str, resource_type):
    filter = authorize_model(oso=current_app.oso, actor=g.current_user, action=action, session=g.session, model=resource_type)
    return g.session.query(resource_type).filter(filter)


# docs: begin-get-resource-by
def get_or_404(self, cls: Type[Any], **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


Session.get_or_404 = get_or_404  # type: ignore
# docs: end-get-resource-by
