import { GoogleGenAI } from "@google/genai"
import { logger } from "../utils/logger.js"
import messageModel from "../models/message.model.js"

async function createEmbedding(text) {
    try {
        const ai = new GoogleGenAI({})

        const response = await ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: text,
            config: {
                outputDimensionality: 768
            }
        })

        return (response.embeddings[0].values)
    } catch (err) {
        logger.error(err)
        throw err
    }
}

async function searchKnowledgeBase(embedding, chatId) {
    try {
        const results = await messageModel.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: embedding,
                    numCandidates: 100,
                    limit: 5,
                    filter: { chatId: chatId }
                }
            }
        ]);

        return results

    } catch (err) {
        logger.error(err)
        throw err
    }
}

export { createEmbedding, searchKnowledgeBase }