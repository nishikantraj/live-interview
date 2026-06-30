import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";

const Form = () => {
  const [gitHub, setGitHub] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async () => {
    setLoading(true);

    try {
      if (!gitHub) {
        toast.error("Please provide valid Github link", {
          style: {
            background: "#111111",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,.08)",
          },
        });
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/v1/pre-interview`,
        {
          gitHub,
        }
      );

      navigate(`/interview/${response.data.interviewId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to fetch repositories"
        );
      } else {
        toast.error("Unexpected error occurred");
      }

      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black" />

        <div className="absolute left-1/2 top-24 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[180px]" />

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-3xl">
          {/* Badge */}
          <div className="mb-10 flex justify-center">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-400 backdrop-blur">
              AI Powered Technical Interview
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-6 text-center">
            <h1 className="text-5xl font-light tracking-tight md:text-7xl">
              Live
              <br />
              AI Interview
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-zinc-500">
              Get interviewed on your own GitHub projects.
              <br />
              Personalized technical questions generated from your repositories.
            </p>
          </div>

          {/* Card */}
          <div className="mt-16 rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/20">
            <div className="space-y-6">
              <Input
                value={gitHub}
                onChange={(e) => setGitHub(e.target.value)}
                placeholder="https://github.com/your-username"
                className="h-14 rounded-full border-white/10 bg-black px-6 text-base text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-white/30"
              />

              <Button
                disabled={loading}
                onClick={onSubmit}
                className="group h-14 w-full rounded-full bg-white text-black transition-all duration-300 hover:scale-[1.01] hover:bg-zinc-200 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Processing repositories...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Start Interview
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </div>

            {/* Features */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {[
                "Repository Analysis",
                "AI Generated Questions",
                "Real Interview Flow",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-zinc-400 transition-all duration-300 hover:border-white/20 hover:text-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-sm text-zinc-600">
            Built for developers who want realistic technical interview practice.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form;