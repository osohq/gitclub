from flask import g, current_app
from sqlalchemy.orm.session import Session
from werkzeug.exceptions import Forbidden, NotFound
from typing import Any, Dict, Optional, Type
import functools

from ..models import Base

Permissions = Dict[Type[Base], str]


# docs: begin-session-decorator
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
    # docs: end-session-decorator


def get_or_raise(self, cls: Type[Any], error, **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise error
    return resource

# docs: begin-get-resource-by
def get_or_403(self, cls: Type[Any], **kwargs):
    return self.get_or_raise(cls, Forbidden, **kwargs)

# docs: begin-get-resource-by
def get_or_404(self, cls: Type[Any], **kwargs):
    return self.get_or_raise(cls, NotFound, **kwargs)

Session.get_or_404 = get_or_404  # type: ignore
Session.get_or_403 = get_or_403  # type: ignore
Session.get_or_raise = get_or_raise  # type: ignore
# docs: end-get-resource-by
