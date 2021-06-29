from flask import g, current_app
from sqlalchemy.orm.session import Session
from werkzeug.exceptions import Forbidden, NotFound
from typing import Any, Dict, Optional, Type
import functools

from ..models import Base

Permissions = Dict[Type[Base], str]


def session(checked_permissions: Optional[Permissions]):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            g.session = current_app.authorized_sessionmaker(
                get_checked_permissions=lambda: checked_permissions
            )()
            return func(*args, **kwargs)

        return wrapper

    return decorator


def check_permission(action: str, resource: Base):
    if not current_app.oso.is_allowed(g.current_user, action, resource):
        raise Forbidden


def get_or_404(self, cls: Type[Any], **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


Session.get_or_404 = get_or_404  # type: ignore
