import json

from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship, scoped_session

from sqlalchemy_oso.hooks import authorized_sessionmaker, make_authorized_query_cls

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(256))

    def repr(self):
        return {"id": self.id, "email": self.email}
