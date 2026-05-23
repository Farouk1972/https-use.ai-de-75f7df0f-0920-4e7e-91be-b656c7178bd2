import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function check() {
  const m = await ai.models.list();
  for await (const model of m) {
    console.log(model.name);
  }
}
check().catch(console.error);
