import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import axios from "axios";
import { ArrowRight, Sparkles } from "lucide-react";

type Message = {
  id: string;
  message: string;
  type: "User" | "Assistant";
};

export default function Interview() {
  const { interviewId } = useParams<{ interviewId: string }>();

  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer State
  const [timeElapsed, setTimeElapsed] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end", // Aligns the bottom of the spacer with the bottom of the window
    });
  }, [messages, loading]);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startInterview = async () => {
    if (!interviewId) return;

    setLoading(true);
    setHasStarted(true);

    try {
      const res = await axios.post(
        "http://localhost:3001/api/v1/interview/start",
        {
          interviewId,
        }
      );

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        message: res.data.question || res.data.reply,
        type: "Assistant",
      };

      setMessages([aiMessage]);
    } catch (error) {
      console.error("Initialization error:", error);
      setHasStarted(false);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await axios.post(
        "http://localhost:3001/api/v1/interview/message",
        {
          interviewId,
          answer: currentAnswer,
        }
      );

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

  return (
    <>
      {/* Global Scrollbar Styling */}
      <style>{`
        html {
          scrollbar-width: thin;
          scrollbar-color: #27272a #000000;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #000000;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>

      {/* ==========================================
                 START INTERVIEW SCREEN
      ==========================================
      */}
      {!hasStarted ? (
        <div className="relative min-h-screen bg-black text-white">
          {/* Background - Fixed so it covers the whole screen evenly */}
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-black" />
            <div className="absolute left-1/2 top-24 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[180px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_70%)]" />
          </div>

          {/* Hero */}
          <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20">
            <div className="w-full max-w-3xl">
              {/* Badge */}
              <div className="mb-8 flex justify-center">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-xl">
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                    Interview Ready
                  </span>
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-5 text-center">
                <h1 className="text-5xl font-light tracking-tight md:text-7xl">
                  Technical
                  <br />
                  Interview
                </h1>

                <p className="mx-auto max-w-xl text-lg leading-8 text-zinc-500">
                  Your repositories have been analyzed successfully.
                  <br />
                  The interviewer is ready whenever you are.
                </p>
              </div>

              {/* Card */}
              <div className="mt-16 rounded-[32px] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl transition-all duration-500 hover:border-white/20">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Mode
                    </p>
                    <h3 className="mt-3 text-lg font-light">Live Interview</h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Source
                    </p>
                    <h3 className="mt-3 text-lg font-light">GitHub Projects</h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Session
                    </p>
                    <h3 className="mt-3 font-mono text-sm text-zinc-300">
                      {interviewId?.slice(0, 8)}...
                    </h3>
                  </div>
                </div>

                <button
                  onClick={startInterview}
                  disabled={loading}
                  className="group mt-10 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white text-black transition-all duration-300 hover:scale-[1.01] hover:bg-zinc-200 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Preparing Interview...
                    </>
                  ) : (
                    <>
                      Begin Interview
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500">
                  <span>Repository Analysis</span>
                  <span>•</span>
                  <span>Context Aware Questions</span>
                  <span>•</span>
                  <span>Adaptive Follow-ups</span>
                </div>
              </div>

              <div className="mt-12 text-center text-sm text-zinc-600">
                Press Begin Interview when you're ready.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /*
        ==========================================
                   LIVE CHAT SCREEN
        ==========================================
        */
        <div className="relative min-h-screen bg-black text-white">
          {/* Background */}
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-black" />
            <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-[200px]" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col">
            {/* Header (Fixed) */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
              <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
                    LIVE INTERVIEW
                  </p>
                  <h1 className="mt-1 text-2xl font-light">Technical Screening</h1>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-mono text-zinc-400">
                    {formatTime(timeElapsed)}
                  </span>
                  <div className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 bg-black/40">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="text-sm text-zinc-400">Recording</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Chat Content (Scrolls with Window) */}
            <main className="flex-1 mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pt-10 pb-6">
              {messages.map((msg, index) => {
                const isUser = msg.type === "User";

                return (
                  <div
                    key={msg.id}
                    className={`flex animate-in fade-in slide-in-from-bottom-4 flex-col duration-300 ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`mb-3 flex items-center gap-3 ${
                        isUser ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                        {isUser ? "You" : "AI"}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          {isUser
                            ? "YOUR RESPONSE"
                            : `QUESTION ${Math.ceil((index + 1) / 2)}`}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-3xl border border-white/10 p-6 backdrop-blur-xl shadow-2xl ${
                        isUser ? "bg-white/[0.08]" : "bg-[#090909]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-8 text-zinc-200">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                      AI
                    </div>
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                      THINKING
                    </p>
                  </div>
                  <div className="max-w-[85%] rounded-3xl border border-white/10 bg-[#090909] p-6 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-white" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-white delay-150" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-white delay-300" />
                      <span className="ml-3 text-zinc-500">
                        Generating next question...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Spacer so the last message is never hidden behind the fixed input area */}
              <div ref={bottomRef} className="h-32 w-full flex-shrink-0" />
            </main>

            {/* Bottom Input Area (Fixed) */}
            <div className="fixed bottom-0 left-0 z-50 w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-24">
              <div className="mx-auto w-full max-w-4xl px-4 pb-6">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-xl">
                  <textarea
                    rows={2}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAnswer();
                      }
                    }}
                    placeholder="Write your answer here..."
                    className="w-full resize-none bg-transparent text-lg leading-8 text-white outline-none placeholder:text-zinc-600"
                  />

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-zinc-600">
                      Press Enter to submit • Shift + Enter for newline
                    </p>
                    <button
                      disabled={loading || !answer.trim()}
                      onClick={sendAnswer}
                      className="group flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Submit
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}