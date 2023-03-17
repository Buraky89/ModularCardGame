import jwt from "jsonwebtoken";

interface User {
  username: string;
  avatar: string;
}

export class UserManager {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  public createUser(username: string, avatar: string): User {
    return { username, avatar };
  }

  public issueToken(user: User): string {
    const token = jwt.sign(
      { username: user.username, avatar: user.avatar },
      this.secret
    );
    return token;
  }

  public validateToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, this.secret) as User;
      const user = { username: decoded.username, avatar: decoded.avatar };
      return user;
    } catch (error) {
      return null;
    }
  }
}
