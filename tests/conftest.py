import pytest

from app import create_app, models
from app.fixtures import load_fixture_data


@pytest.fixture(scope="module")
def test_client():
    flask_app = create_app()
    test_client = flask_app.test_client()
    return test_client


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@pytest.fixture(scope="function")
def test_db_session():
    engine = create_engine("sqlite://")
    models.Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    load_fixture_data(session)

    return session
