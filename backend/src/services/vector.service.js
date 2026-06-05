import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger.js";
import messageModel from "../models/message.model.js";
import { GEMINI_API_KEY } from "../../config/index.js";

async function createEmbedding(text) {
  try {
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    return response.embeddings[0].values;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

async function searchKnowledgeBase(embedding, chatId) {
  try {
    const results = await messageModel.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 5,
          filter: { chatId: chatId },
        },
      },
      {
        $addFields: {
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: {
          score: { $gte: 0.75 },
        },
      },
    ]);

    return results;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

export { createEmbedding, searchKnowledgeBase };
