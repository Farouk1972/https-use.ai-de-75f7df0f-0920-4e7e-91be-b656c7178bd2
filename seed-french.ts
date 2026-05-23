import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { setGlobalDispatcher, Agent } from 'undici';

dotenv.config();

setGlobalDispatcher(new Agent({
  headersTimeout: 600000,
  bodyTimeout: 600000
}));

const getAi = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateLesson(language: string, level: string, title: string, retries = 5): Promise<any> {
    console.log(`Generating ${language} ${level} - ${title}...`);
    const ai = getAi();
    
    const prompt = `
      You are a master linguistic professor creating a deep, professional language learning lesson for the Polyglot Academy.
      
      Target Language: ${language}
      CEFR Level: ${level}
      Lesson Topic: ${title}
      
      Requirements:
      1. Keep the tone completely serious, academically rigorous, and deep. Zero hallucination.
      2. The story MUST be approximately 500 words in length.
      3. The dialogue MUST be approximately 500 words in length.
      4. Include exactly 100 important idiomatic expressions or set phrases.
      5. Provide 2 in-depth grammar points that perfectly fit ${level}. Cover active/passive voice if appropriate.
      6. Conjugate ALL key verbs from the story and dialogue. Provide complete conjugation tables for multiple tenses/moods appropriate for ${level} (e.g., Present, Past, Future, Subjunctive, Imperative).
      7. The vocabulary section MUST include prepositions, adverbs, adjectives, active/passive vocabulary, and nouns. ALL items must have example sentences. Nouns must include definite/indefinite articles and plural forms.
      8. All Arabic translations must be highly accurate, nuanced, and formatted correctly.
      9. Everything must strictly follow the requested JSON structure. No markdown wrapping.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              story: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  arabic: { type: Type.STRING },
                },
              },
              dialogue: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                    arabic: { type: Type.STRING }
                  },
                }
              },
              grammar_points: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING, },
                    arabic_explanation: { type: Type.STRING },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          arabic: { type: Type.STRING }
                        },
                      }
                    }
                  },
                }
              },
              conjugations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    verb: { type: Type.STRING },
                    arabic_meaning: { type: Type.STRING },
                    tenses: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          tense_name: { type: Type.STRING },
                          table: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                pronoun: { type: Type.STRING },
                                form: { type: Type.STRING }
                              },
                            }
                          }
                        }
                      }
                    }
                  },
                }
              },
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    type: { type: Type.STRING },
                    arabic: { type: Type.STRING },
                    article: { type: Type.STRING },
                    plural: { type: Type.STRING },
                    example_text: { type: Type.STRING },
                    example_arabic: { type: Type.STRING }
                  },
                }
              },
              expressions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    expression: { type: Type.STRING },
                    arabic: { type: Type.STRING },
                    usage_example: { type: Type.STRING }
                  },
                }
              }
            },
          }
        }
      });

      if (!response.text) return null;
      return JSON.parse(response.text);
    } catch (error: any) {
      if (error?.status === 429 && retries > 0) {
        console.warn(`Rate limit hit (429). Retrying in 30 seconds... (${retries} retries left)`);
        await sleep(30000);
        return generateLesson(language, level, title, retries - 1);
      } else {
        console.error("Failed to generate:", error?.message || error);
        throw error;
      }
    }
}

async function run() {
  const language = 'French';
  const level = 'A1';
  // Attempting 100 lessons
  const lessons: any[] = [];
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'src/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, 'french_a1.json');
  if (fs.existsSync(filePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(existing)) {
        lessons.push(...existing);
        console.log(`Loaded ${lessons.length} existing lessons from file. Will skip these.`);
      }
    } catch(e) {}
  }
  
  for (let i = 1; i <= 100; i++) {
    const id = `FR-A1-${String(i).padStart(3, '0')}`;
    
    // Skip if already generated
    if (lessons.some(l => l.lesson_id === id)) {
      console.log(`Skipping already generated lesson: ${id}`);
      continue;
    }

    const title = `Lesson ${i}`;
    try {
      const content = await generateLesson(language, level, title);
      if (content) {
          lessons.push({
            lesson_id: id,
            language_code: "FR",
            language_name: "French",
            native_name: "Français",
            level: "A1",
            lesson_number: i,
            title: title,
            story_status: "Generated",
            dialogue_status: "Generated",
            grammar_status: "Generated",
            conjugation_status: "Generated",
            vocabulary_count: content.vocabulary?.length || 0,
            expressions_count: content.expressions?.length || 0,
            arabic_meaning_status: "Generated",
            content: content
          });
          
          // Save incrementally just in case it crashes midway
          fs.writeFileSync(path.join(outputDir, 'french_a1.json'), JSON.stringify(lessons, null, 2));
      }
      
      // Deliberate sleep between successful requests to prevent slamming the free tier
      console.log("Waiting 30 seconds before next lesson generation to respect Quota...");
      await sleep(30000); 
    } catch(err) {
      console.error(`Failed to complete lesson ${i}`, err);
    }
  }

  console.log("Done generating all French A1 lessons!");
}
run();
