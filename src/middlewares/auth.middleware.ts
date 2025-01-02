import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-private-key';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        fullName: string | null;
        roleId: string;
        status: string;
    }
}

export interface ChatRequest {
    message: string;
    fundId: string;
}

export const verifyToken = (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            res.status(401).json({ error: 'Không tìm thấy token' });
            return;
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            res.status(401).json({ error: 'Token không hợp lệ' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET);
       const data = decoded as { 
            userId: string;
            email: string;
            fullName: string | null;
            roleId: string;
            status: string;
        };
        console.warn(data);
        (req as AuthRequest).user = data;
        
        next();
    } catch (error) {
        console.error('JWT Verify Error:', error);
        res.status(401).json({ error: 'Token không hợp lệ' });
        return;
    }
}; 