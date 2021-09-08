TEST_FLAGS :=

test: test-flask-sqlalchemy test-rails test-express-typeorm

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
