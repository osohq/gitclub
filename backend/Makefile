null  :=
space := $(null) #
colon := :#
POLICIES := $(subst ${space},${colon},$(wildcard app/*.polar))

dev:
	FLASK_DEBUG=1 FLASK_RUN_EXTRA_FILES="${POLICIES}" flask run

run:
	flask run

fixtures:
	FLASK_APP="app:create_app(None, True)" flask run

test:
	pytest

.PHONY: dev run fixtures test
