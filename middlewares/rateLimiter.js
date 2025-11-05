import rateLimit from 'express-rate-limit';

export const moderationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500,
    message: {
        status: 429,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});