from app import create_app
from app.fixtures import load_fixture_data
import pytest


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
def test_db_session(test_app):
    # Get a DB session from the test app with no
    # authorization applied
    with test_app.app_context():
        yield test_app.authorized_sessionmaker(
            get_user=lambda: None, get_checked_permissions=lambda: None
        )()
