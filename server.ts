import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { setGlobalDispatcher, Agent } from "undici";

// Increase global fetch timeout for Gemini API calls
setGlobalDispatcher(
  new Agent({
    headersTimeout: 600000, // 10 minutes
    bodyTimeout: 600000,
  }),
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Wait to initialize AI SDK until request to allow the dev server to start without the key initially
  const getAi = () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  };

  // Chat API endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const ai = getAi();
      const prompt = `
        You are an elite, highly intelligent linguistic AI assistant. 
        Your goal is to answer questions related to language learning, grammar, and conjugation perfectly.
        
        Context of the current lesson (if any):
        ${context ? JSON.stringify(context) : 'None'}

        User's question: ${message}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a clever chatbot expert in language, grammar, conjugation, and all features. Provide accurate, helpful, and concise answers."
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // API endpoint
  app.post("/api/generate-lesson", async (req, res) => {
    try {
      const { lesson_id, language, level, title } = req.body;

      if (!language || !level || !title) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const ai = getAi();

      const prompt = `
        You are a distinguished linguistic professor and curriculum designer creating an elite, hyper-professional language learning module for the Polyglot Academy.
        
        Target Language: ${language}
        CEFR Level: ${level}
        Lesson Topic: ${title}
        
        Requirements:
        1. Keep the tone completely serious, academically rigorous, and deep. You must employ sophisticated lexical choices and framework-level pedagogical design. Absolutely zero hallucination. Provide ONLY the JSON. Be concise where possible to avoid reaching output limits.
        2. Real immersive lesson stories: The story MUST be comprehensive, engaging, deep, and progress from simple to complex. Length MUST be 300-450 words, focusing on professional or highly relevant real-world contexts.
        3. Authentic dialogue: The dialogue MUST be deep, progressive (simple to complex), and 300-450 words in length, between two characters, demonstrating natural yet elevated conversational dynamics.
        4. Include exactly 20 indispensable, highly practical idiomatic expressions or set phrases strictly relevant to the lesson.
        5. Provide in-depth, master-level grammar points completely covering the topic and perfectly calibrated to ${level}. Provide explanations in BOTH Arabic and English.
        6. Conjugate 3 key verbs derived from the text. Provide complete, flawlessly formatted conjugation tables for all essential tenses and moods. ${language === 'Hebrew' ? 'For Hebrew, include Nikkud (vowels), transliteration, and specify gender/number in the forms.' : ''}
        7. The vocabulary section MUST include rich vocabulary items. ALL items must feature contextually accurate example sentences. Nouns MUST include definite/indefinite articles and plural forms. Include IPA phonetics for pronunciation training. Provide exactly 20 advanced vocabulary items.
        8. Provide a Quiz Generation section with 5 multiple-choice questions.
        9. All translations must be linguistically perfect, highly nuanced, academically precise, and provided in BOTH Arabic and English. 
        10. Everything must strictly adhere to the requested JSON structure. No markdown formatting outside of the JSON payload.
      `;

      let response;
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-pro-latest"
      ];

      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          response = await ai.models.generateContent({
            model: modelsToTry[i],
            contents: prompt,
            config: {
              maxOutputTokens: 8192,
              temperature: 0.1, // very low temperature for zero hallucination and strict adherence
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  story: {
                    type: Type.OBJECT,
                    properties: {
                      text: {
                        type: Type.STRING,
                        description: `A professional story/text in language appropriate for level`,
                      },
                      arabic: {
                        type: Type.STRING,
                        description:
                          "Professional Arabic translation of the story",
                      },
                      english: {
                        type: Type.STRING,
                        description:
                          "Professional English translation of the story",
                      },
                    },
                    required: ["text", "arabic", "english"],
                  },
                  dialogue: {
                    type: Type.ARRAY,
                    description: `A realistic professional dialogue scenario in language`,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING },
                        arabic: { type: Type.STRING },
                        english: { type: Type.STRING },
                      },
                      required: ["speaker", "text", "arabic", "english"],
                    },
                  },
                  grammar_points: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        explanation: {
                          type: Type.STRING,
                          description:
                            "Deep professional explanation of a grammar concept relevant to this lesson",
                        },
                        arabic_explanation: {
                          type: Type.STRING,
                          description:
                            "Translation of the explanation in Arabic",
                        },
                        english_explanation: {
                          type: Type.STRING,
                          description:
                            "Translation of the explanation in English",
                        },
                        examples: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              text: { type: Type.STRING },
                              arabic: { type: Type.STRING },
                              english: { type: Type.STRING },
                            },
                            required: ["text", "arabic", "english"],
                          },
                        },
                      },
                      required: [
                        "title",
                        "explanation",
                        "arabic_explanation",
                        "english_explanation",
                        "examples",
                      ],
                    },
                  },
                  conjugations: {
                    type: Type.ARRAY,
                    description:
                      "Conjugations for key verbs in appropriate tenses and moods",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        verb: { type: Type.STRING },
                        arabic_meaning: { type: Type.STRING },
                        english_meaning: { type: Type.STRING },
                        tenses: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              tense_name: { type: Type.STRING },
                              forms: {
                                type: Type.ARRAY,
                                description:
                                  "Array of conjugated forms with their pronouns (e.g. 'je suis', 'tu es')",
                                items: {
                                  type: Type.STRING,
                                },
                              },
                            },
                            required: ["tense_name", "forms"],
                          },
                        },
                      },
                      required: [
                        "verb",
                        "arabic_meaning",
                        "english_meaning",
                        "tenses",
                      ],
                    },
                  },
                  vocabulary: {
                    type: Type.ARRAY,
                    description:
                      "Advanced vocabulary items including nouns, prepositions, adverbs, adjectives.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        type: {
                          type: Type.STRING,
                          description:
                            "e.g., Noun (m), Verb, Adjective, Adverb, Preposition",
                        },
                        arabic: { type: Type.STRING },
                        english: { type: Type.STRING },
                        ipa: {
                          type: Type.STRING,
                          description: "IPA phonetic spelling",
                        },
                        article: {
                          type: Type.STRING,
                          description:
                            "Definite or indefinite article (e.g., le, la, der, die, das)",
                        },
                        plural: {
                          type: Type.STRING,
                          description: "Plural form of the noun",
                        },
                        example_text: { type: Type.STRING },
                        example_arabic: { type: Type.STRING },
                        example_english: { type: Type.STRING },
                      },
                      required: [
                        "word",
                        "type",
                        "arabic",
                        "english",
                        "ipa",
                        "example_text",
                        "example_arabic",
                        "example_english",
                      ],
                    },
                  },
                  expressions: {
                    type: Type.ARRAY,
                    description: "Idiomatic expressions or set phrases.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        expression: { type: Type.STRING },
                        arabic: { type: Type.STRING },
                        english: { type: Type.STRING },
                        usage_example: { type: Type.STRING },
                      },
                      required: [
                        "expression",
                        "arabic",
                        "english",
                        "usage_example",
                      ],
                    },
                  },
                  quiz: {
                    type: Type.ARRAY,
                    description:
                      "Multiple choice quiz questions based on lesson content.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        answer_index: {
                          type: Type.NUMBER,
                          description:
                            "0-based index of the correct answer in the options array",
                        },
                        explanation: {
                          type: Type.STRING,
                          description:
                            "Brief explanation of the correct answer",
                        },
                      },
                      required: [
                        "question",
                        "options",
                        "answer_index",
                        "explanation",
                      ],
                    },
                  },
                },
                required: [
                  "story",
                  "dialogue",
                  "grammar_points",
                  "conjugations",
                  "vocabulary",
                  "expressions",
                  "quiz",
                ],
              },
            },
          });

          if (response && response.text) {
            try {
              let rawText = response.text.trim();
              if (rawText.startsWith("```")) {
                rawText = rawText
                  .replace(/^```(json)?\n?/, "")
                  .replace(/\n?```$/, "");
              }
              try {
                const parsedResult = JSON.parse(rawText);
                return res.json({ content: parsedResult });
              } catch (firstErr) {
                try {
                  // Some naive attempts to fix JSON truncation
                  const repaired = rawText.trim() + '"}';
                  const parsedResult = JSON.parse(repaired);
                  return res.json({ content: parsedResult });
                } catch (secondErr) {
                  throw new Error(
                    `JSON_PARSE_ERROR: ${(firstErr as Error).message}`,
                  );
                }
              }
            } catch (ext) {
              console.error(
                `Model ${modelsToTry[i]} returned invalid JSON:`,
                (ext as Error).message,
              );
              throw ext;
            }
          }
        } catch (err: any) {
          console.error(
            `Model ${modelsToTry[i]} failed.`,
            err.message?.substring(0, 150),
          );

          const errMsgLower = err.message ? err.message.toLowerCase() : "";
          if (
            errMsgLower.includes("exceeded your current quota") &&
            !errMsgLower.includes("retry in")
          ) {
            // If the daily quota is exhausted (no 'retry in' text), trying other models won't help and just spams logs.
            throw err;
          }

          if (i === modelsToTry.length - 1) {
            throw err; // Re-throw the error if it's the last model
          }
          // Sleep for 3 seconds before trying the next model to respect rate limits
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: "AI generation failed to return valid response." });
      }
    } catch (err: any) {
      const errMsg = (err.message || "").toLowerCase();
      if (errMsg.includes("429") || err.status === 429 || errMsg.includes("exceeded your current quota") || errMsg.includes("quota")) {
        // Do not use console.error for rate limit hits to avoid log pollution
        return res.status(429).json({ error: err.message || errMsg });
      }
      if (errMsg.includes("503") || err.status === 503) {
        return res.status(503).json({ error: err.message || errMsg });
      }
      console.error("Error generating lesson:", err);
      res.status(500).json({ error: err.message || errMsg || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Set express timeout to 10 minutes to match
  server.setTimeout(600000);
}

startServer();
