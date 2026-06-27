import express from "express";
import cors from "cors";
import { preInterviewBody } from "./types";
import { gitHubScrapper } from "./scrapper/github";
import { prisma } from "./db";
import { generateProjectSummary } from "./ai/sumarry";
import { genreateQuestions } from "./ai/generateQuestion";

const PORT = 3001;
const app = express();
app.use(express.json());
app.use(cors());

// --- TYPES & INTERFACES ---
type InterviewSummary = {
    candidate?: { overallExperienceLevel?: string };
    overallTechStack?: string[];
    recommendedInterviewFocus?: string[];
    projects?: Array<{
        name?: string;
        technologies?: string[];
        possibleDiscussionTopics?: string[];
    }>;
};

// --- REUSABLE HELPER FUNCTIONS (DRY Clean Up) ---

const parseLLMJson = (text: string) => {
    if (!text) return null;
    const clean = text
        .replace(/^```json\s*/i, "") // Removes ```json and any newlines at the start
        .replace(/```\s*$/, "")      // Removes ``` and any spaces/newlines at the end
        .trim();
    return JSON.parse(clean);
};

const getRefinedSummary = (rawSummary: unknown) => {
    if (!rawSummary || typeof rawSummary !== "object") return {};
    const summary = rawSummary as InterviewSummary;
    
    return {
        experience: summary.candidate?.overallExperienceLevel ?? "Junior",
        techStack: summary.overallTechStack ?? [],
        interviewFocus: summary.recommendedInterviewFocus ?? [],
        projects: (summary.projects ?? []).slice(0, 5).map((project) => ({
            name: project.name ?? "Untitled project",
            tech: project.technologies ?? [],
            topics: project.possibleDiscussionTopics ?? [],
        })),
    };
};

// --- ROUTE ENDPOINTS ---

app.get('/', (req, res) => {
    return res.status(200).json({ message: "working fine" });
});

/**
 * ENDPOINT 1: PRE-INTERVIEW (User Verification & Summary Setup Only)
 * Hitted right when the candidate provides their GitHub link.
 */
app.post('/api/v1/pre-interview', async (req, res) => {
    const { data, success } = preInterviewBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({ message: "Incorrect body" });
    }
    
    const gitHubURL = data.gitHub.endsWith("/") ? data.gitHub.slice(0, -1) : data.gitHub;
    const gitHubUsername = gitHubURL.split("/").pop()!;
    console.log("check1");
    
    try {
        console.log("check2");
        let user = await prisma.user.findUnique({
            where: { userName: gitHubUsername }
        });
        
        if (!user) {
            console.log("check3");
            const reposData = await gitHubScrapper(gitHubUsername);
            const rawSummary = await generateProjectSummary(reposData);
            const summaryJson = parseLLMJson(rawSummary!);
            
            console.log("check4");
            user = await prisma.user.create({
                data: {
                    userName: gitHubUsername,
                    summary: summaryJson,
                    gitHubMetaData: reposData
                }
            });
        }
        
        console.log("check5");
        // Setup initial "Pre" session mapping back to user record
        const interview = await prisma.interview.create({
            data: {
                status: "Pre",
                user: { connect: { id: user.id } }
            }
        });
        
        // Redirect client straight to /interview/:id room safely without blocking on LLM queries
        return res.status(200).json({ interviewId: interview.id });

    } catch (error) {
        console.error("Pre-interview Setup Error:", error);
        return res.status(500).json({ message: "Failed to initialize interview session." });
    }
});

/**
 * ENDPOINT 2: START INTERVIEW (Triggers via frontend "Start" button click)
 * Transitions the interview status to 'Inprogress' and fetches the opening question.
 */
app.post('/api/v1/interview/start', async (req, res) => {
    const { interviewId } = req.body;
    if (!interviewId) {
        return res.status(400).json({ message: "Missing interviewId" });
    }

    try {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: { user: true }
        });

        if (!interview) {
            return res.status(404).json({ message: "Interview session not found." });
        }

        // Update status cleanly to active tracking mode
        await prisma.interview.update({
            where: { id: interviewId },
            data: { status: "Inprogress" }
        });

        const refinedSummary = getRefinedSummary(interview.user.summary);
        
        // Generate dynamic customized greeting question
        const rawQuestion = await genreateQuestions(refinedSummary, interview.id);
        const parsedQuestion = parseLLMJson(rawQuestion!);

        // Save AI opening statement to history
        await prisma.messages.create({
            data: {
                message: parsedQuestion.question,
                type: "Assistant",
                interview: { connect: { id: interview.id } }
            }
        });

        return res.status(200).json(parsedQuestion);

    } catch (error) {
        console.error("Start Interview Error:", error);
        return res.status(500).json({ message: "Failed to load opening query." });
    }
});

/**
 * ENDPOINT 3: INTERVIEW MESSAGE (User submits structural text follow-ups)
 * Streamlined processing loops with efficient database fetches.
 */
app.post("/api/v1/interview/message", async (req, res) => {
    const { interviewId, answer } = req.body;

    if (!interviewId || !answer) {
        return res.status(400).json({ message: "Invalid request payloads" });
    }

    try {
        // Optimistically write User message history
        await prisma.messages.create({
            data: {
                message: answer,
                type: "User",
                interview: { connect: { id: interviewId } },
            },
        });

        // Combined Single Fetch for User context and historical parameters
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                user: true,
                messages: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!interview) {
            return res.status(404).json({ message: "Interview context dropped." });
        }

        const refinedSummary = getRefinedSummary(interview.user.summary);

        // Fetch sequential follow-up tracking metrics mapping across contexts
        const response = await genreateQuestions(refinedSummary, interview.id);
        const cleanQuestion = parseLLMJson(response!);

        // Commit newly evaluated AI context tracking nodes
        await prisma.messages.create({
            data: {
                message: cleanQuestion.question,
                type: "Assistant",
                interview: { connect: { id: interviewId } },
            },
        });

        return res.status(200).json(cleanQuestion);

    } catch (error) {
        console.error("Message Loop Process Error:", error);
        return res.status(500).json({ message: "Internal conversational fault generated." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});