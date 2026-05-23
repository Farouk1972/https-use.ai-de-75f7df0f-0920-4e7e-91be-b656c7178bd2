import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: "hello",
    });
    console.log(response.text);
  } catch (e: any) {
    console.error(e.message);
  }
}
test();
