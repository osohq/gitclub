import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy_oso import SQLAlchemyOso

from app import create_app, models
from app.fixtures import load_fixture_data

db_path = "sqlite:///:memory:"


@pytest.fixture
def test_app():
    return create_app(db_path, True)


@pytest.fixture
def test_client(test_app):
    from flask.testing import FlaskClient

    def log_in_as(self, email):
        self.post("/session", json={"email": email})

    FlaskClient.log_in_as = log_in_as  # type: ignore

    return test_app.test_client()


@pytest.fixture
def engine():
    return create_engine(db_path)


@pytest.fixture
def Session(engine):
    return sessionmaker(bind=engine)


@pytest.fixture
def oso(Session):
    oso = SQLAlchemyOso(models.Base)
    oso.enable_roles(models.User, Session)
    oso.load_file("app/authorization.polar")
    return oso


@pytest.fixture
def test_db_session(Session, engine, oso):
    models.Base.metadata.create_all(engine)
    load_fixture_data(engine, oso.roles)
    return Session()
