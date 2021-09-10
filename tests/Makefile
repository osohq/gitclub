TEST_FLAGS :=

test: test-flask-sqlalchemy test-flask-sqlalchemy-oso test-rails test-express-typeorm

# TODO better name
test-flask-sqlalchemy-oso: .make.requirements-install
	BACKEND=flask-sqlalchemy-oso pytest

test-express-typeorm: .make.requirements-install
	BACKEND=express-typeorm pytest ${TEST_FLAGS}

test-flask-sqlalchemy: .make.requirements-install
	BACKEND=flask-sqlalchemy pytest ${TEST_FLAGS}

test-rails: .make.requirements-install
	BACKEND=rails pytest ${TEST_FLAGS}

fmt: .make.requirements-install
	black .

.make.requirements-install: requirements.txt
	pip install -r requirements.txt
	touch $@
