import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const contentFilter = async (req, res, next) => {
    try {
        const { content, title } = req.body;
        const textToCheck = [content, title].filter(Boolean).join(' ');

        if (!textToCheck) {
            return res.status(400).json({ error: 'No content to moderate' });
        }

        const moderationResponse = await openai.moderations.create({
            input: textToCheck,
        });

        const results = moderationResponse.results[0];

        console.log('Moderation Results:', results);

        if (results.flagged) {
            return res.status(400).json({
                error: 'Content flagged as inappropriate',
                details: results.categories
            });
        }

        req.moderationResults = results;
        next();

    } catch (error) {
        console.error('Moderation API Error:', error);
        return res.status(500).json({ 
            error: 'Content moderation failed',
            details: error.message
        });
    }
};

export default contentFilter;