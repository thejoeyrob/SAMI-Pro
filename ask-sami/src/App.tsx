import { useState } from "react";
import {
  Sparkles,
  Upload,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Copy,
  Download,
} from "lucide-react";
import "./App.css";

type Proposal = {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  confidence: number;
};

export function App() {
  const [step, setStep] = useState<"upload" | "prompt" | "generating" | "results">(
    "upload"
  );
  const [file, setFile] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f.name);
      setStep("prompt");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStep("generating");

    // Simulate AI proposal generation
    setTimeout(() => {
      setProposals([
        {
          id: "1",
          title: "Optimized Loading Zone",
          description:
            "Relocate delivery area to southwest corner with 12m x 8m pad, reducing access conflicts and improving flow to building entrance.",
          benefits: [
            "30% reduction in vehicle turnaround time",
            "Better sight lines",
            "Dedicated welfare area",
          ],
          confidence: 92,
        },
        {
          id: "2",
          title: "Enhanced Safety Perimeter",
          description:
            "Add exclusion zones around existing services with updated crane exclusions based on power lines. Create restricted areas for underground utilities.",
          benefits: [
            "Compliance with HSE guidelines",
            "Automated clash detection",
            "Reduced site risk assessments",
          ],
          confidence: 88,
        },
        {
          id: "3",
          title: "Phased Access Strategy",
          description:
            "Three-phase approach: initial setup with temporary access, main works with dedicated welfare, demobilization with equipment staging.",
          benefits: [
            "Minimized disruption",
            "Clear phase gates",
            "Client coordination simplification",
          ],
          confidence: 85,
        },
      ]);
      setStep("results");
    }, 2000);
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div className="logo">
            <Sparkles size={24} />
            <h1>Ask SAMI</h1>
          </div>
          <p className="tagline">AI-powered site planning proposals</p>
        </div>
      </header>

      <main>
        {step === "upload" && (
          <div className="step upload-step">
            <h2>Import Your Site Plan</h2>
            <div className="upload-area">
              <Upload size={48} />
              <p>Drag & drop a SAMI project (.sami) or GeoJSON</p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".sami,.geojson,.json"
                style={{ display: "none" }}
                id="file-input"
              />
              <label htmlFor="file-input" className="btn primary">
                Choose file
              </label>
            </div>
          </div>
        )}

        {step === "prompt" && (
          <div className="step prompt-step">
            <h2>What would you like to improve?</h2>
            <div className="file-info">
              <CheckCircle2 size={18} /> {file}
            </div>
            <textarea
              placeholder="e.g., 'Optimize the loading area and add safety exclusions' or 'Suggest a phased access strategy for this site'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="prompt-input"
            />
            <div className="suggestions">
              <strong>Try:</strong>
              <button
                onClick={() => setPrompt("Optimize vehicle access and delivery zones")}
                className="suggestion-btn"
              >
                Optimize access
              </button>
              <button
                onClick={() =>
                  setPrompt("Generate safety compliance recommendations")
                }
                className="suggestion-btn"
              >
                Safety compliance
              </button>
              <button
                onClick={() => setPrompt("Design a phased work approach")}
                className="suggestion-btn"
              >
                Phased planning
              </button>
            </div>
            <div className="actions">
              <button
                onClick={() => setStep("upload")}
                className="btn secondary"
              >
                Choose different file
              </button>
              <button onClick={handleGenerate} className="btn primary">
                <Lightbulb size={18} /> Generate proposals
              </button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="step generating-step">
            <div className="spinner" />
            <h2>Thinking...</h2>
            <p>Analyzing your site and generating tailored proposals</p>
          </div>
        )}

        {step === "results" && (
          <div className="step results-step">
            <div className="results-header">
              <h2>AI Proposals for Your Site</h2>
              <button
                onClick={() => setStep("upload")}
                className="btn secondary small"
              >
                Start over
              </button>
            </div>

            <div className="proposals">
              {proposals.map((p) => (
                <div key={p.id} className="proposal-card">
                  <div className="proposal-header">
                    <h3>{p.title}</h3>
                    <div className="confidence">
                      {p.confidence}% match
                    </div>
                  </div>
                  <p className="proposal-description">{p.description}</p>
                  <div className="benefits">
                    {p.benefits.map((b, i) => (
                      <div key={i} className="benefit">
                        <CheckCircle2 size={16} /> {b}
                      </div>
                    ))}
                  </div>
                  <div className="proposal-actions">
                    <button className="btn secondary small">
                      <Copy size={16} /> Copy to clipboard
                    </button>
                    <button className="btn primary small">
                      <Download size={16} /> Apply to plan
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cta-section">
              <h3>Ready to implement?</h3>
              <p>
                Use these proposals in SAMI Elite to create detailed drawings,
                export PDFs, and share with your team.
              </p>
              <a href="https://sami.site" className="btn primary">
                Open SAMI Elite <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>
          <strong>Ask SAMI</strong> uses AI to generate site planning proposals.
          Always verify with professional surveyors and local regulations.
        </p>
        <div className="footer-links">
          <a href="/privacy">Privacy</a>
          <a href="https://sami.site">SAMI Elite</a>
          <a href="mailto:support@sami.site">Support</a>
        </div>
      </footer>
    </div>
  );
}
