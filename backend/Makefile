null  :=
space := $(null) #
colon := :#
POLICIES := $(subst ${space},${colon},$(wildcard app/*.polar))

dev:
	FLASK_DEBUG=1 FLASK_RUN_EXTRA_FILES="${POLICIES}" flask run

run:
	flask run

fixtures:
	rm -f roles.db
	FLASK_APP="app:create_app(None, True)" flask run

fmt:
	black .

test:
	pytest

.PHONY: dev run fixtures test
