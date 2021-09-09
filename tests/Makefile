test: test-flask-sqlalchemy-oso test-rails

test-flask-sqlalchemy-oso: .make.requirements-install
	BACKEND=flask-sqlalchemy-oso pytest

test-rails: .make.requirements-install
	BACKEND=rails pytest

fmt: .make.requirements-install
	black .

.make.requirements-install: requirements.txt
	pip install -r requirements.txt
	touch $@
