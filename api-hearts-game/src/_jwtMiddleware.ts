import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

export interface AuthenticatedRequest extends Request {
    user?: User
}

interface User {
    uuid: string;
    username: string;
    avatar: string;
};


export interface TokenPayload {
    sid: string;
    preferred_username: string;
}

export const toTokenPayload = (jwtToken: string) => {
    return jwt.decode(jwtToken) as TokenPayload;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.sendStatus(401);
    }

    const publicKey = process.env.PUBLIC_KEY as string;

    jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, user) => {
        if (err && err.toString().indexOf("expired") === -1) {
            return res.sendStatus(403);
        }
        const decoded = jwt.decode(token) as TokenPayload;
        if (!decoded) {
            return res.sendStatus(403);
        }
        req.user = { uuid: decoded.sid, username: decoded.preferred_username, avatar: "" };
        next();
    });
};