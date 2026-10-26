
"use client";

/*
 * Project Name : CodeTutor - AI-Powered Adaptive Coding Tutor
 * File Name    : page.tsx
 * Description  : Main student coding workspace.
 *                Includes problem description, Monaco editor, real API
 *                execution, test results, hints, and a reference visualizer.
 *
 * Current Scope:
 *   1. Two Sum problem
 *   2. Python code editor
 *   3. FastAPI POST /api/run integration
 *   4. Result display for passed/failed test cases
 *   5. Reference algorithm trace (not generated from submitted code)
 *
 * Next Stage   : Add actual trace generation and adaptive AI problem creation.
 */

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CircleHelp,
  Clock,
  Code2,
  FileCode2,
  Lightbulb,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Trophy,
  Zap,
} from "lucide-react";

/*
 * Interface Name : Problem
 * Description    : Describes the data needed to display a coding problem.
 */
interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation: string;
  }[];
  constraints: string[];
  starterCode: string;
}

/*
 * Interface Name : TraceStep
 * Description    : Describes one illustrative step in the algorithm visualizer.
 * Note           : These steps are prebuilt reference data, not a trace of the
 *                  student's submitted program.
 */
interface TraceStep {
  title: string;
  explanation: string;
  array: number[];
  activeIndices: number[];
  variables: { name: string; value: string }[];
}

/*
 * Interface Name : ApiRunResponse
 * Description    : Describes the JSON response returned by FastAPI /api/run.
 */
interface ApiRunResponse {
  status:
    | "accepted"
    | "wrong_answer"
    | "runtime_error"
    | "time_limit_exceeded"
    | "service_unavailable";
  passed: number;
  total: number;
  message: string;
  results: {
    test_number: number;
    passed: boolean;
    message: string;
  }[];
}

/*
 * Constant Name : API_BASE_URL
 * Description   : Base URL for the local FastAPI backend.
 * Configuration : Change this value when the backend is deployed elsewhere.
 */
const API_BASE_URL = "http://127.0.0.1:8000";

/*
 * Constant Name : problems
 * Description   : Initial problem catalogue. The first implementation uses
 *                 a local Two Sum problem while adaptive AI generation is built.
 */
const problems: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays & Hashing",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9.",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6.",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Exactly one valid answer exists.",
    ],
    starterCode:
      "def two_sum(nums, target):\n    # Return the indices of two numbers that add up to target.\n    pass\n\n\nprint(two_sum([2, 7, 11, 15], 9))",
  },
];

/*
 * Constant Name : initialTrace
 * Description   : Illustrative trace for the first Two Sum example.
 * Important     : This trace is independent of the code submitted by the student.
 */
const initialTrace: TraceStep[] = [
  {
    title: "Initialize",
    explanation:
      "Start with an empty hash map. It will store numbers already visited and their indices.",
    array: [2, 7, 11, 15],
    activeIndices: [],
    variables: [
      { name: "target", value: "9" },
      { name: "i", value: "Not started" },
      { name: "seen", value: "{}" },
    ],
  },
  {
    title: "Inspect index 0",
    explanation:
      "The current number is 2. Calculate its complement: target - current = 9 - 2 = 7.",
    array: [2, 7, 11, 15],
    activeIndices: [0],
    variables: [
      { name: "target", value: "9" },
      { name: "nums[i]", value: "2" },
      { name: "complement", value: "7" },
      { name: "seen", value: "{}" },
    ],
  },
  {
    title: "Store the number",
    explanation:
      "The complement is not in the map yet. Store the current number 2 at index 0.",
    array: [2, 7, 11, 15],
    activeIndices: [0],
    variables: [
      { name: "target", value: "9" },
      { name: "complement", value: "7" },
      { name: "seen", value: "{2: 0}" },
    ],
  },
  {
    title: "Inspect index 1",
    explanation:
      "The current number is 7. Its complement is 9 - 7 = 2, which is already in the map.",
    array: [2, 7, 11, 15],
    activeIndices: [0, 1],
    variables: [
      { name: "target", value: "9" },
      { name: "nums[i]", value: "7" },
      { name: "complement", value: "2" },
      { name: "seen", value: "{2: 0}" },
    ],
  },
  {
    title: "Solution found",
    explanation:
      "The complement 2 was found at index 0. The current number is at index 1, so return [0, 1].",
    array: [2, 7, 11, 15],
    activeIndices: [0, 1],
    variables: [
      { name: "target", value: "9" },
      { name: "result", value: "[0, 1]" },
      { name: "status", value: "Solved" },
    ],
  },
];

/*
 * Function Name : Home
 * Description   : Renders the complete adaptive coding workspace.
 * Input         : None.
 * Output        : React page with problem details, editor, test results,
 *                 and the reference algorithm visualizer.
 */
export default function Home() {
  // Keep track of the selected problem.
  const [selectedProblem, setSelectedProblem] = useState<Problem>(problems[0]);

  // Store the exact source currently entered into Monaco Editor.
  const [code, setCode] = useState<string>(problems[0].starterCode);

  // Control the active problem information tab.
  const [activeTab, setActiveTab] = useState<"description" | "hints">(
    "description"
  );

  // Store the currently displayed reference-trace step.
  const [traceIndex, setTraceIndex] = useState(0);

  // Control automatic playback in the visualizer.
  const [isPlaying, setIsPlaying] = useState(false);

  // Store real backend output or a connection/error message.
  const [output, setOutput] = useState(
    "Run your code to evaluate it using the FastAPI backend."
  );

  // Track whether an API evaluation has completed.
  const [hasRun, setHasRun] = useState(false);

  // Prevent overlapping execution requests.
  const [isExecuting, setIsExecuting] = useState(false);

  // Toggle a reference solution for learning purposes.
  const [showSolution, setShowSolution] = useState(false);

  // Get the currently selected reference trace step.
  const currentStep = initialTrace[traceIndex];

  /*
   * Effect Name : Visualizer Playback
   * Description : Automatically advances the reference trace while playback
   *               is active and stops at the final step.
   */
  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setTraceIndex((previousIndex) => {
        if (previousIndex >= initialTrace.length - 1) {
          return previousIndex;
        }
        return previousIndex + 1;
      });
    }, 1600);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  /*
   * Effect Name : Stop Visualizer At Final Step
   * Description : Stops playback when the final trace step is reached.
   */
  useEffect(() => {
    if (traceIndex >= initialTrace.length - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [traceIndex, isPlaying]);

  /*
   * Function Name : selectProblem
   * Description   : Loads the selected problem and resets related workspace state.
   */
  function selectProblem(problem: Problem) {
    setSelectedProblem(problem);
    setCode(problem.starterCode);
    setTraceIndex(0);
    setIsPlaying(false);
    setHasRun(false);
    setShowSolution(false);
    setOutput("Run your code to evaluate it using the FastAPI backend.");
  }

  /*
   * Function Name : executeCode
   * Description   : Sends the current editor source to FastAPI and displays
   *                 the actual result returned by the backend.
   * Input         : Mode used to label the result panel.
   * Output        : Test status, number passed, and per-test feedback.
   *
   * Important     : Run and Submit currently use the same backend test suite.
   */
  async function executeCode(mode: "run" | "submit") {
    if (isExecuting) return;

    setIsExecuting(true);
    setHasRun(false);
    setOutput("Sending code to the Python execution service...");

    try {
      // Send source code and the selected backend-supported problem ID.
      const response = await fetch(`${API_BASE_URL}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: selectedProblem.id,
          code,
        }),
      });

      // Read JSON response, including FastAPI validation errors.
      const data: unknown = await response.json();

      if (!response.ok) {
        const errorBody = data as { detail?: unknown };
        const detail =
          typeof errorBody.detail === "string"
            ? errorBody.detail
            : JSON.stringify(errorBody.detail ?? data, null, 2);

        setOutput(`API request failed (${response.status}).\n\n${detail}`);
        return;
      }

      const result = data as ApiRunResponse;

      // Format each test result as readable text for the output panel.
      const testDetails = result.results
        .map(
          (test) =>
            `Test ${test.test_number}: ${test.passed ? "PASSED" : "FAILED"} — ${test.message}`
        )
        .join("\n");

      setOutput(
        `${mode === "submit" ? "Submission result" : "Run result"}\n\n` +
          `Status: ${result.status}\n` +
          `Passed: ${result.passed}/${result.total}\n\n` +
          `${result.message}\n\n` +
          (testDetails || "No individual test results were returned.")
      );

      setHasRun(true);
    } catch (error) {
      // A fetch error usually means FastAPI is stopped or the request was blocked.
      const details =
        error instanceof Error ? error.message : "Unknown network error";

      setOutput(
        "Could not connect to the CodeTutor API.\n\n" +
          `Confirm that FastAPI is running at ${API_BASE_URL}.\n\n` +
          `Details: ${details}`
      );
    } finally {
      setIsExecuting(false);
    }
  }

  /*
   * Function Name : runSample
   * Description   : Evaluates the current editor code using the configured tests.
   */
  function runSample() {
    void executeCode("run");
  }

  /*
   * Function Name : submitCode
   * Description   : Submits the current editor code for backend evaluation.
   * Note          : A separate hidden-test submission pipeline is not implemented.
   */
  function submitCode() {
    void executeCode("submit");
  }

  /*
   * Function Name : resetVisualizer
   * Description   : Stops playback and returns to the first reference step.
   */
  function resetVisualizer() {
    setIsPlaying(false);
    setTraceIndex(0);
  }

  /*
   * Function Name : nextStep
   * Description   : Advances one step in the reference visualization.
   */
  function nextStep() {
    setIsPlaying(false);
    setTraceIndex((index) => Math.min(index + 1, initialTrace.length - 1));
  }

  /*
   * Function Name : previousStep
   * Description   : Moves one step backward in the reference visualization.
   */
  function previousStep() {
    setIsPlaying(false);
    setTraceIndex((index) => Math.max(index - 1, 0));
  }

  /*
   * Constant Name : referenceSolution
   * Description   : A known correct Two Sum solution shown only on request.
   */
  const referenceSolution =
    "def two_sum(nums, target):\n" +
    "    seen = {}\n\n" +
    "    for i, num in enumerate(nums):\n" +
    "        complement = target - num\n\n" +
    "        if complement in seen:\n" +
    "            return [seen[complement], i]\n\n" +
    "        seen[num] = i\n\n" +
    "    return []\n\n" +
    "print(two_sum([2, 7, 11, 15], 9))";

  // Render the complete coding workspace.
  return (
    <main className="min-h-screen bg-[#0b0d12] text-slate-200">
      {/* Header: product name and current workspace identity. */}
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500">
            <BrainCircuit size={21} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">
              CodeMentor AI
            </h1>
            <p className="text-[11px] text-slate-500">
              Adaptive coding practice
            </p>
          </div>
          <span className="ml-3 hidden rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-300 sm:inline-flex">
            <Sparkles size={13} className="mr-1.5" />
            Learning workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
            <Trophy size={15} className="text-amber-400" />
            <span>Baseline assessment</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            S
          </div>
        </div>
      </header>

      {/* Main layout: sidebar and editor always remain usable on smaller screens. */}
      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)] 2xl:grid-cols-[230px_minmax(0,1fr)_340px]">
        {/* Sidebar: initial problem list and adaptive learning status. */}
        <aside className="border-b border-white/10 bg-[#0e1017] p-4 xl:border-r xl:border-b-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Problem set
            </h2>
            <ListChecks size={16} className="text-slate-500" />
          </div>

          <div className="mb-6 rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Sparkles size={14} />
              Adaptive learning
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Start with Two Sum. Future recommendations will use verified
              results from your submitted solutions.
            </p>
          </div>

          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-600">
            Arrays &amp; Hashing
          </p>

          {problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => selectProblem(problem)}
              className={`mb-2 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                selectedProblem.id === problem.id
                  ? "border-indigo-400/30 bg-indigo-400/10"
                  : "border-transparent hover:bg-white/[0.04]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                  hasRun && selectedProblem.id === problem.id
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                    : "border-slate-600 text-slate-500"
                }`}
              >
                {hasRun && selectedProblem.id === problem.id ? (
                  <Check size={12} />
                ) : (
                  <span className="text-[10px]">1</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">
                  {problem.title}
                </p>
                <p className="mt-1 text-[11px] text-emerald-400">
                  {problem.difficulty}
                </p>
              </div>
            </button>
          ))}

          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span aria-hidden="true">🔒</span>
              <span>Next problem will unlock after assessment is implemented.</span>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-white/[0.03] p-3">
            <p className="mb-2 text-xs font-medium text-slate-300">
              Learning path
            </p>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[10%] rounded-full bg-indigo-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Baseline assessment in progress
            </p>
          </div>
        </aside>

        {/* Center panel: problem description, code editor, and real API output. */}
        <section className="flex min-w-0 flex-col">
          {/* Problem title and metadata. */}
          <div className="border-b border-white/10 px-5 py-4 lg:px-7">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Problems</span>
              <ArrowRight size={12} />
              <span>{selectedProblem.topic}</span>
              <ArrowRight size={12} />
              <span className="text-slate-300">{selectedProblem.title}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedProblem.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-400">
                    {selectedProblem.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock size={13} />
                    Suggested: 15 min
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Zap size={13} />
                    {selectedProblem.topic}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("hints")}
                className="flex items-center gap-2 rounded-lg border border-indigo-400/20 px-3 py-2 text-xs text-indigo-300 hover:bg-indigo-400/10"
              >
                <Lightbulb size={14} />
                Get a hint
              </button>
            </div>
          </div>

          {/* Problem description and hint tabs. */}
          <div className="border-b border-white/10 px-5 lg:px-7">
            <div className="flex gap-5">
              <button
                onClick={() => setActiveTab("description")}
                className={`border-b-2 py-3 text-xs font-medium ${
                  activeTab === "description"
                    ? "border-indigo-400 text-white"
                    : "border-transparent text-slate-500"
                }`}
              >
                <BookOpen size={14} className="mr-2 inline" />
                Description
              </button>
              <button
                onClick={() => setActiveTab("hints")}
                className={`border-b-2 py-3 text-xs font-medium ${
                  activeTab === "hints"
                    ? "border-indigo-400 text-white"
                    : "border-transparent text-slate-500"
                }`}
              >
                <Lightbulb size={14} className="mr-2 inline" />
                Hints
              </button>
            </div>
          </div>

          {/* Render the selected problem content. */}
          <div className="min-h-[260px] border-b border-white/10 px-5 py-5 lg:px-7">
            {activeTab === "description" ? (
              <div className="max-w-3xl space-y-5">
                <p className="text-sm leading-7 text-slate-300">
                  {selectedProblem.description}
                </p>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    Examples
                  </h3>
                  {selectedProblem.examples.map((example, index) => (
                    <div
                      key={index}
                      className="mb-3 rounded-lg border border-white/10 bg-white/[0.025] p-4"
                    >
                      <p className="mb-2 text-xs font-semibold text-slate-400">
                        Example {index + 1}
                      </p>
                      <p className="mb-1 font-mono text-xs leading-6 text-slate-300">
                        <span className="text-slate-500">Input: </span>
                        {example.input}
                      </p>
                      <p className="mb-2 font-mono text-xs text-slate-300">
                        <span className="text-slate-500">Output: </span>
                        {example.output}
                      </p>
                      <p className="text-xs leading-5 text-slate-500">
                        <span className="text-slate-400">Explanation: </span>
                        {example.explanation}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Constraints
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-xs leading-5 text-slate-400">
                    {selectedProblem.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <Lightbulb
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-300"
                  />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-amber-200">
                      Hint 1 — Find the complement
                    </h3>
                    <p className="text-sm leading-6 text-slate-400">
                      For each number x, calculate target - x. Check whether
                      that complementary number has already appeared.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-200">
                    Hint 2 — Use a hash map
                  </h3>
                  <p className="text-sm leading-6 text-slate-400">
                    Store each previously visited number and its index so you
                    can look up a complement efficiently.
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  These are built-in hints. Adaptive AI hints will be added later.
                </p>
              </div>
            )}
          </div>

          {/* Editor toolbar: language and editor actions. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#10131b] px-5 py-3 lg:px-7">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <FileCode2 size={16} className="text-indigo-300" />
              Solution
              <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] text-slate-400">
                Python 3
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSolution((visible) => !visible)}
                className="rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
              >
                {showSolution ? "Hide reference" : "Show reference"}
              </button>
              <button
                onClick={() => {
                  setShowSolution(false);
                  setCode(selectedProblem.starterCode);
                }}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.05]"
              >
                <RotateCcw size={13} />
                Reset code
              </button>
            </div>
          </div>

          {/* Monaco Editor: source code is the code sent to FastAPI. */}
          <div className="h-[380px] min-w-0">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={showSolution ? referenceSolution : code}
              onChange={(value) => {
                setShowSolution(false);
                setCode(value ?? "");
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 18, bottom: 18 },
                wordWrap: "on",
              }}
            />
          </div>

          {/* Run and Submit now call the real backend execution endpoint. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/10 bg-[#10131b] px-5 py-4 lg:px-7">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CircleHelp size={14} />
              <span>Runs submitted code through the FastAPI backend.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runSample}
                disabled={isExecuting}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExecuting ? (
                  <Activity size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {isExecuting ? "Running..." : "Run sample"}
              </button>
              <button
                onClick={submitCode}
                disabled={isExecuting}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExecuting ? (
                  <Activity size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {isExecuting ? "Evaluating..." : "Submit"}
              </button>
            </div>
          </div>

          {/* Output panel displays the actual API evaluation result. */}
          <div className="p-5 lg:px-7">
            <div className="mb-3 flex items-center gap-2">
              <Terminal size={15} className="text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-300">
                Test results
              </h3>
              {hasRun && (
                <span className="rounded bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                  Backend response
                </span>
              )}
            </div>
            <pre className="min-h-24 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">
              {output}
            </pre>
          </div>
        </section>

        {/* Visualizer sidebar: reference trace for the example algorithm. */}
        <aside className="border-t border-white/10 bg-[#0e1017] p-5 2xl:border-t-0 2xl:border-l">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-indigo-300" />
              <h2 className="text-sm font-semibold text-white">
                Algorithm visualizer
              </h2>
            </div>
            <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] text-slate-500">
              Reference trace
            </span>
          </div>

          {/* Timeline and explanation for the selected reference step. */}
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Execution step</span>
              <span className="font-mono text-xs text-indigo-300">
                {traceIndex + 1} / {initialTrace.length}
              </span>
            </div>
            <div className="flex gap-1.5">
              {initialTrace.map((step, index) => (
                <button
                  key={step.title}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setTraceIndex(index);
                  }}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    index <= traceIndex ? "bg-indigo-400" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-white">
                {currentStep.title}
              </h3>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                {currentStep.explanation}
              </p>
            </div>

            {/* Playback controls for stepping through the reference trace. */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <button
                onClick={resetVisualizer}
                aria-label="Reset visualizer"
                className="rounded-md p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
              >
                <RotateCcw size={15} />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={previousStep}
                  disabled={traceIndex === 0}
                  aria-label="Previous step"
                  className="rounded-md border border-white/10 p-2 text-slate-300 disabled:opacity-30"
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  onClick={() => {
                    if (traceIndex === initialTrace.length - 1) {
                      setTraceIndex(0);
                    }
                    setIsPlaying((playing) => !playing);
                  }}
                  aria-label={isPlaying ? "Pause playback" : "Play playback"}
                  className="rounded-md bg-indigo-500 p-2.5 text-white hover:bg-indigo-400"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button
                  onClick={nextStep}
                  disabled={traceIndex === initialTrace.length - 1}
                  aria-label="Next step"
                  className="rounded-md border border-white/10 p-2 text-slate-300 disabled:opacity-30"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
              <span className="text-[10px] text-slate-500">Auto: 1.6s</span>
            </div>
          </div>

          {/* Array display highlights indices used in the reference trace. */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300">Array state</h3>
              <span className="text-[10px] text-slate-500">nums</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {currentStep.array.map((value, index) => {
                const isActive = currentStep.activeIndices.includes(index);
                return (
                  <div key={index} className="text-center">
                    <div
                      className={`flex h-12 items-center justify-center rounded-lg border font-mono text-sm transition ${
                        isActive
                          ? "border-indigo-400 bg-indigo-400/15 text-indigo-200"
                          : "border-white/10 bg-white/[0.03] text-slate-300"
                      }`}
                    >
                      {value}
                    </div>
                    <p
                      className={`mt-2 text-[10px] ${
                        isActive ? "text-indigo-300" : "text-slate-600"
                      }`}
                    >
                      index {index}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="h-2 w-2 rounded-sm bg-indigo-400" />
              Active element
            </div>
          </div>

          {/* Variables display the values associated with the reference step. */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300">Variables</h3>
              <Code2 size={14} className="text-slate-500" />
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              {currentStep.variables.map((variable, index) => (
                <div
                  key={variable.name}
                  className={`flex items-center justify-between gap-3 px-3 py-3 ${
                    index !== currentStep.variables.length - 1
                      ? "border-b border-white/[0.06]"
                      : ""
                  }`}
                >
                  <code className="text-xs text-indigo-300">{variable.name}</code>
                  <code className="break-all text-right text-xs text-slate-300">
                    {variable.value}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Complexity section introduces time and space complexity. */}
          <div className="rounded-xl border border-white/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Zap size={15} className="text-amber-300" />
              <h3 className="text-xs font-semibold text-slate-200">
                Complexity target
              </h3>
            </div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Time</span>
              <code className="text-xs text-emerald-300">O(n)</code>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Space</span>
              <code className="text-xs text-emerald-300">O(n)</code>
            </div>
            <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-5 text-slate-500">
              These targets describe the hash-map approach, not a measurement
              of the submitted code.
            </p>
          </div>

          {/* AI assessment preview describes the planned adaptive feature. */}
          <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-200">
              <Sparkles size={14} />
              Adaptive assessment
            </div>
            <p className="text-xs leading-5 text-slate-400">
              The next stage will use verified test results, attempts, and
              solution analysis to recommend a personalized coding problem.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
