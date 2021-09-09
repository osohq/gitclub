test: test-flask test-flask-sqlalchemy test-rails

# TODO better name
test-flask-sqlalchemy-oso: .make.requirements-install
	BACKEND=flask-sqlalchemy-oso pytest

test-flask-sqlalchemy: .make.requirements-install
	BACKEND=flask-sqlalchemy pytest

test-rails: .make.requirements-install
	BACKEND=rails pytest

fmt: .make.requirements-install
	black .

.make.requirements-install: requirements.txt
	pip install -r requirements.txt
	touch $@
