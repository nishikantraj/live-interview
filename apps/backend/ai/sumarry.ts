import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY1!,
});

export async function generateProjectSummary(
  githubData: any
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `
        You are an experienced Senior Software Engineer reviewing a candidate's GitHub profile before a technical interview.

        Your task is to analyze the repositories and produce a structured JSON summary that will later be used by another AI interviewer.

        ### Rules

        * Return ONLY valid JSON.
        * Do NOT wrap the response inside markdown or json blocks.
        * Do NOT include explanations outside the JSON.
        * If information is unavailable, use null or an empty array.
        * Infer technologies and project complexity only from the provided repository metadata.
        * Do not invent features that are not supported by the repository information.

        ### Required JSON Structure

        {
        "candidate": {
            "githubUsername": "",
            "overallExperienceLevel": "",
            "overallAssessment": "",
            "strengths": [],
            "possibleWeaknesses": []
        },
        "projects": [
            {
            "name": "",
            "description": "",
            "importance": "",
            "difficulty": "",
            "primaryLanguage": "",
            "technologies": [],
            "concepts": [],
            "possibleDiscussionTopics": [],
            "estimatedComplexity": "",
            "confidence": ""
            }
        ],
        "overallTechStack": [],
        "recommendedInterviewFocus": [],
        "observations": []
        }
        

        ### Repository Data

        ${JSON.stringify(githubData)}

    `,
  });

  return response.text;
}