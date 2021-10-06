from .models import Issue, User

john_email = "john@beatles.com"
paul_email = "paul@beatles.com"
mike_email = "mike@monsters.com"
ringo_email = "ringo@beatles.com"


def load_fixture_data(session):
    #########
    # Users #
    #########

    john = User(email=john_email)
    paul = User(email=paul_email)
    admin = User(email="admin@admin.com")
    mike = User(email=mike_email)
    sully = User(email="sully@monsters.com")
    ringo = User(email=ringo_email)
    randall = User(email="randall@monsters.com")
    users = [
        john,
        paul,
        admin,
        mike,
        sully,
        ringo,
        randall,
    ]
    for user in users:
        session.add(user)

    too_much_critical_acclaim = Issue(title="Too much critical acclaim", repo_id=1)
    late_filing = Issue(title="Paperwork is late again", repo_id=2)
    issues = [too_much_critical_acclaim, late_filing]
    for issue in issues:
        session.add(issue)

    session.flush()
    session.commit()
    session.close()
