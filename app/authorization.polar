allow(user: User, "GET", req: Request) if
    print(user.email,req);

allow(user: User, "POST", req: Request) if
    print(user.email,req);