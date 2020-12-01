allow(user: User, "GET", req: Request) if
    print(user.email,req);