import 'express';

declare module 'express' {
    interface Request {
        // payload from shop JWT: { cid: string }
        shop?: { cid: string };
    }
}
