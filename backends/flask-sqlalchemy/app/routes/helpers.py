from sqlalchemy.orm.session import Session
from werkzeug.exceptions import NotFound
from typing import Any, Dict, Type

from ..models import Base

Permissions = Dict[Type[Base], str]


# docs: begin-get-resource-by
def get_or_404(self, cls: Type[Any], **kwargs):
    resource = self.query(cls).filter_by(**kwargs).one_or_none()
    if resource is None:
        raise NotFound
    return resource


Session.get_or_404 = get_or_404  # type: ignore
# docs: end-get-resource-by
