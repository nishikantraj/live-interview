import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import axios from "axios";

type Message = {
  id: string;
  message: string;
  type: "User" | "Assistant";
};

export default function Interview() {
  // 1. Dynamic routing hook to capture interviewId from URL path (/interview/:interviewId)
  const { interviewId } = useParams<{ interviewId: string }>();
  
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scrolling viewport logic
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // 2. Trigger active interview session + Fetch dynamic AI Greeting message
  const startInterview = async () => {
    
    if (!interviewId) return;
    setLoading(true);
    setHasStarted(true);

    try {
      const res = await axios.post("http://localhost:3001/api/v1/interview/start", {
        interviewId,
      });

      // API returns { question: "AI Greeting question text..." }
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        message: res.data.question || res.data.reply,
        type: "Assistant",
      };

      setMessages([aiMessage]);
    } catch (error) {
      console.error("Initialization error:", error);
      setHasStarted(false); // fallback to re-allow click state on fault triggers
    } finally {
      setLoading(false);
    }
  };

  // 3. Dynamic User Follow-up processing execution block
  const sendAnswer = async () => {
    if (!answer.trim() || loading || !interviewId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      message: answer,
      type: "User",
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentAnswer = answer;
    setAnswer("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3001/api/v1/interview/message", {
        interviewId,
        answer: currentAnswer,
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        message: res.data.question || res.data.reply,
        type: "Assistant",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          message: "Something went wrong while generating the next question.",
          type: "Assistant",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING VIEWS ---

  // Intro welcome layout prior to hitting the active LLM room initialization loops
  if (!hasStarted) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white px-4 animate-fade-in">
        <div className="max-w-md text-center space-y-6 border border-zinc-800 p-8 rounded-2xl bg-zinc-900/50 backdrop-blur">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Ready for your Interview?</h1>
            <p className="text-zinc-400 text-sm">
              We have processed your repository profile context metrics. Click below to introduce yourself to the technical screener.
            </p>
          </div>
          <button
            onClick={startInterview}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 font-medium rounded-xl transition duration-200 active:scale-98 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  // Live active interview interface block containing message streams
  return (
    <div className="h-screen flex flex-col bg-black text-white antialiased">
      {/* Top Header Row */}
      <div className="border-b border-zinc-800 p-4 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-md font-semibold tracking-wide">Live Technical Screening Room</h1>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full font-mono border border-zinc-800">
          ID: {interviewId?.slice(0, 8)}...
        </span>
      </div>

      {/* Main Historical Chat Scroller Body Layout */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-black to-zinc-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "User" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 shadow-md transition-all text-sm leading-relaxed ${
                msg.type === "User"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}

        {/* Dynamic AI Thinking Bubble Animation Layer */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-1">
              <span className="text-xs mr-1">AI processing</span>
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Persistent Message Input Field Footer Layout */}
      <div className="border-t border-zinc-800 p-4 bg-zinc-950">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAnswer();
              }
            }}
            placeholder="Type your technical response here... (Press Enter to Send)"
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 resize-none text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
            rows={2}
          />
          <button
            onClick={sendAnswer}
            disabled={loading || !answer.trim()}
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl disabled:opacity-40 disabled:hover:bg-blue-600 transition duration-200 flex items-center justify-center cursor-pointer active:scale-95"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}