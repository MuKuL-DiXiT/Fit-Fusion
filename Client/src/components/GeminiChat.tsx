"use client";

import { useState } from "react";

export function GeminiChat() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const assistantMessage = { role: "assistant" as const, content: data.text };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        role: "assistant" as const,
        content: "Sorry, I'm having trouble connecting. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-2xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold">AI Diet Planner</h2>
        <p className="text-muted-foreground">
          Tell me about your goals, exercise routine, and budget to get a personalized diet plan.
        </p>
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-4 h-96 overflow-y-auto pr-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  🤖
                </span>
              )}
              <div
                className={`rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === "user" && (
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  👤
                </span>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                🤖
              </span>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="For example: 'I want to lose weight, I exercise 3 times a week, and my budget is moderate.'"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
