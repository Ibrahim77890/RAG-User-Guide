import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

const SECRET_KEY = process.env.SECRET_KEY!;

interface TokenPayload {
    sessionId: string;
}

export const generateToken = (sessionId: string):string => {
    try {
        const payload: TokenPayload = { sessionId: `${sessionId}_${uuid().toString()}` };
        console.log("Payload", payload)
        const response = jwt.sign(payload, "secret_key", { expiresIn: '10m' });
        console.log("Response: ", response)
        return response;
    } catch (error) {
        console.error('Error in token generation:', error);
        throw error;
    }
};

export const verifyToken = async (token: string): Promise<TokenPayload | null> => {
    try {
        return jwt.verify(token, SECRET_KEY) as TokenPayload;
    } catch (error) {
        console.error('Invalid token:', error);
        return null;
    }
};
