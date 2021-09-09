from flask import g, current_app
from sqlalchemy.orm.session import Session
from werkzeug.exceptions import Forbidden, NotFound
from typing import Any, Dict, Optional, Type
import functools

from ..models import Base, User

Permissions = Dict[Type[Base], str]


# docs: begin-session-decorator
def session(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        g.session = current_app.authorized_sessionmaker()
        return func(*args, **kwargs)

    return wrapper

    # docs: end-session-decorator


def authorized_resource(actn: str, cls: Type[Any], **kwargs):
    rsrcs = authorized_resources(actn, cls, **kwargs)
    if len(rsrcs) == 0:
        raise NotFound
    return rsrcs[0]


def authorized_resources(actn: str, cls: Type[Any], **kwargs):
    query = current_app.oso.authorized_query(g.current_user, actn, cls)
    if query is None:
        raise NotFound
    return [rsrc for rsrc in query.filter_by(**kwargs)]


# docs: begin-get-resource-by
def get_or_404(self, cls: Type[Any], **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


def distinct(elems):
    return [elem for i, elem in enumerate(elems) if elem not in elems[:i]]


Session.get_or_404 = get_or_404  # type: ignore
# docs: end-get-resource-by
