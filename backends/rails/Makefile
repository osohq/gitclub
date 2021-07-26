dev:
	bundle exec rails s

test-server:
	RAILS_ENV=test bundle exec rails db:migrate
	RAILS_ENV=test bundle exec rails s

fixtures:
	bundle exec rails db:seed

.PHONY: dev fixtures
