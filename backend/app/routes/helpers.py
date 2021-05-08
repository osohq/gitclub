from flask import g, current_app
from werkzeug.exceptions import Forbidden, NotFound
from typing import Any, Dict, Optional, Type
import functools

from ..models import Base

Permissions = Dict[Type[Base], str]


def session(checked_permissions: Optional[Permissions] = None):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            AuthorizedSession = current_app.authorized_sessionmaker(
                get_checked_permissions=lambda: checked_permissions,
            )
            g.session = AuthorizedSession()
            return func(*args, **kwargs)

        return wrapper

    return decorator


def check_permission(action: str, resource: Base):
    if not current_app.oso.is_allowed(g.current_user, action, resource):
        raise Forbidden


# docs: begin-get-resource-by
def get_resource_by(session, cls: Type[Any], **kwargs):
    resource = session.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource
    # docs: end-get-resource-by
