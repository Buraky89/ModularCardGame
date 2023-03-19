import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

interface User {
  uuid: string;
  username: string;
  avatar: string;
}

export class UserManager {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  public createUser(username: string, avatar: string): User {
    const uuid = uuidv4();
    return { uuid, username, avatar };
  }

  public issueToken(user: User): string {
    const token = jwt.sign(
      { uuid: user.uuid, username: user.username, avatar: user.avatar },
      this.secret
    );
    return token;
  }

  public validateToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, this.secret) as User;
      const user = {
        uuid: decoded.uuid,
        username: decoded.username,
        avatar: decoded.avatar,
      };
      return user;
    } catch (error) {
      return null;
    }
  }
}
