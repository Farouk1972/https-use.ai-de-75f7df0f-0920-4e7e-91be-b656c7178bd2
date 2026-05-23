import React, { useState, useMemo, useEffect } from "react";
import {
  Download,
  BookOpen,
  Layers,
  Globe2,
  FileText,
  Settings,
  Search,
  CheckCircle2,
  Circle,
  Wand2,
} from "lucide-react";
import localforage from "localforage";
import { fullLessonIndex, LANGUAGES, LEVELS, LessonIndex } from "./lib/academy";
import { downloadCSV } from "./lib/csv";
import LessonDrawer from "./components/LessonDrawer";

export default function App() {
  const [selectedLang, setSelectedLang] = useState(
    LANGUAGES.find((l) => l.code === "HE")?.code || LANGUAGES[0].code,
  );
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  // Use state for lessons so we can mock "generating" them
  const [lessons, setLessons] = useState<LessonIndex[]>(fullLessonIndex);

  useEffect(() => {
    localforage.getItem<LessonIndex[]>("polyglot_lessons").then((stored) => {
      if (stored && stored.length > 0) {
        const lessonMap = new Map(stored.map((l) => [l.lesson_id, l]));
        setLessons(
          fullLessonIndex.map((l) => {
            const storedLesson = lessonMap.get(l.lesson_id);
            if (storedLesson) {
              return {
                ...l,
                content: storedLesson.content,
                story_status: storedLesson.story_status,
                dialogue_status: storedLesson.dialogue_status,
                grammar_status: storedLesson.grammar_status,
                conjugation_status: storedLesson.conjugation_status,
                arabic_meaning_status: storedLesson.arabic_meaning_status,
                vocabulary_count: storedLesson.vocabulary_count,
                expressions_count: storedLesson.expressions_count,
              };
            }
            return l;
          }),
        );
      }
    });
  }, []);

  // Drawer state
  const [selectedLesson, setSelectedLesson] = useState<LessonIndex | null>(
    null,
  );

  // Filter lessons based on selection
  const filteredLessons = useMemo(() => {
    return lessons.filter(
      (lesson) =>
        lesson.language_code === selectedLang &&
        lesson.level === selectedLevel &&
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [lessons, selectedLang, selectedLevel, searchQuery]);

  const handleDownloadFullJSON = () => {
    const jsonString = JSON.stringify(lessons, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Polyglot_Academy_Full_Index_4200.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrentJSON = () => {
    const jsonString = JSON.stringify(filteredLessons, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Polyglot_Academy_${selectedLang}_${selectedLevel}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullCSV = () => {
    downloadCSV(lessons, "Polyglot_Academy_Full_Index_4200.csv");
  };

  const handleDownloadCurrentCSV = () => {
    downloadCSV(
      filteredLessons,
      `Polyglot_Academy_${selectedLang}_${selectedLevel}.csv`,
    );
  };

  const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedLessons = JSON.parse(text);

        if (Array.isArray(importedLessons)) {
          let newAddedCount = 0;
          let updatedCount = 0;

          setLessons((prev) => {
            const newLessons = [...prev];
            importedLessons.forEach((imported) => {
              const idx = newLessons.findIndex(
                (l) => l.lesson_id === imported.lesson_id,
              );
              if (idx !== -1) {
                newLessons[idx] = {
                  ...newLessons[idx],
                  ...imported,
                  content: imported.content || imported,
                };
                updatedCount++;
              } else {
                newLessons.push(imported);
                newAddedCount++;
              }
            });
            localforage
              .setItem("polyglot_lessons", newLessons)
              .catch(console.error);
            return newLessons;
          });

          alert(
            `Successfully imported ${importedLessons.length} lessons!\n\nAdded newly: ${newAddedCount}\nUpdated/Merged existing: ${updatedCount}`,
          );
        } else {
          alert(
            "The uploaded file does not contain a valid JSON array of lessons.",
          );
        }
      } catch (err) {
        console.error("Error parsing upload:", err);
        alert(
          "Failed to parse the uploaded file. Please ensure it is a valid JSON array of lessons.",
        );
      }
    };
    reader.readAsText(file);
    // resset the input
    event.target.value = "";
  };

  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>("");
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const isBatchingRef = React.useRef(false);

  const handleGenerateLesson = async (lesson: LessonIndex) => {
    const response = await fetch("/api/generate-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_id: lesson.lesson_id,
        language: LANGUAGES.find((l) => l.code === lesson.language_code)?.name,
        level: lesson.level,
        title: lesson.title,
      }),
    });

    let data;
    let responseText = "";
    try {
      responseText = await response.text();
      // Try parsing as JSON first
      data = JSON.parse(responseText);
    } catch (e) {
      if (!response.ok) {
        throw new Error(
          `[HTTP ${response.status}] ${responseText.substring(0, 150)}`,
        );
      }
      throw new Error(
        `Server returned invalid JSON. Status: ${response.status}. Body: ${responseText.substring(0, 150)}...`,
      );
    }

    if (!response.ok) {
      let errText = "";
      if (data && typeof data.error === "object") {
        errText = JSON.stringify(data.error);
      } else if (data && data.error) {
        errText = data.error;
      } else {
        errText = `Server returned status ${response.status}: ${response.statusText}`;
      }
      throw new Error(`[HTTP ${response.status}] ${errText}`);
    }

    const { content } = data;

    // Update local state
    let updatedLesson: LessonIndex | null = null;
    setLessons((prev) => {
      const next = prev.map((l) => {
        if (l.lesson_id === lesson.lesson_id) {
          updatedLesson = {
            ...l,
            content,
            story_status: content.story ? "Generated" : "Pending",
            dialogue_status: content.dialogue?.length ? "Generated" : "Pending",
            grammar_status: content.grammar_points?.length
              ? "Generated"
              : "Pending",
            conjugation_status: content.conjugations?.length
              ? "Generated"
              : "Pending",
            arabic_meaning_status:
              content.story?.arabic || content.dialogue?.[0]?.arabic
                ? "Generated"
                : "Pending",
            vocabulary_count: content.vocabulary?.length || 0,
            expressions_count: content.expressions?.length || 0,
          };
          return updatedLesson;
        }
        return l;
      });
      localforage.setItem("polyglot_lessons", next).catch(console.error);
      return next;
    });

    // Update selected drawer lesson immediately
    setSelectedLesson((prev) =>
      prev && updatedLesson?.lesson_id === prev.lesson_id
        ? updatedLesson
        : prev,
    );
  };

  const handleBatchGenerate = async () => {
    if (isBatchingRef.current) {
      isBatchingRef.current = false;
      setIsBatchGenerating(false);
      return;
    }

    isBatchingRef.current = true;
    setIsBatchGenerating(true);
    setBatchStatus("Starting generation...");

    let targetLessons = lessons.filter((l) => l.story_status === "Pending");
    
    // Prioritize the currently selected language
    targetLessons.sort((a, b) => {
      if (a.language_code === selectedLang && b.language_code !== selectedLang) return -1;
      if (b.language_code === selectedLang && a.language_code !== selectedLang) return 1;
      return 0; // maintain relative order for others
    });

    if (targetLessons.length === 0) {
      if (!window.confirm("All lessons for all languages are already generated. Do you want to RE-GENERATE all of them? (This will take a long time)")) {
        isBatchingRef.current = false;
        setIsBatchGenerating(false);
        setBatchStatus("");
        setBatchProgress({ current: 0, total: 0 });
        return;
      }
      // If user confirms, regenerate all in current view
      targetLessons = lessons;
    }

    setBatchProgress({ current: 0, total: targetLessons.length });

    let retryCount = 0;
    let rateLimitCount = 0;

    try {
      for (let i = 0; i < targetLessons.length; ) {
        if (!isBatchingRef.current) break;

        const lesson = targetLessons[i];
        setBatchStatus(
          `Generating Lesson ${i + 1} of ${targetLessons.length} (${lesson.level} - ${lesson.title.length > 30 ? lesson.title.substring(0, 30) + "..." : lesson.title})...`,
        );

        try {
          await handleGenerateLesson(lesson);
          setBatchProgress((prev) => ({ ...prev, current: i + 1 }));
          setBatchStatus(`Lesson ${i + 1} Complete. Waiting 5s...`);
          await new Promise((r) => setTimeout(r, 5000));
          i++;
          retryCount = 0;
          rateLimitCount = 0;
        } catch (err: any) {
          console.error("Task failed for lesson", lesson.lesson_id, err);
          const msg = err.message ? err.message.toLowerCase() : "";

          let retryDelay = 20000;
          const retryMatch = msg.match(/retry in\s+(\d+(?:\.\d+)?)s/);
          if (retryMatch) {
            retryDelay = parseFloat(retryMatch[1]) * 1000 + 5000;
          }

          if (msg.includes("exceeded your current quota") && !msg.includes("retry in")) {
            alert(
              "Daily Quota Exceeded. You have run out of API credits. Batch generation paused.",
            );
            isBatchingRef.current = false;
            break;
          }

          if (
            msg.includes("429") ||
            msg.includes("rate limit") ||
            msg.includes("too many requests") ||
            msg.includes("rate exceeded") ||
            msg.includes("retry in") ||
            msg.includes("quota") ||
            msg.includes("exhausted")
          ) {
            rateLimitCount++;
            if (rateLimitCount >= 10) {
              alert("Rate limit hit repeatedly. Pausing batch generation.");
              isBatchingRef.current = false;
              break;
            }
            setBatchStatus(`Rate limit hit. Retrying in ${Math.round(retryDelay / 1000)}s...`);
            await new Promise((r) => setTimeout(r, retryDelay));
            continue; // Retry same lesson
          }

          if (msg.includes("503") || msg.includes("504") || msg.includes("timeout") || msg.includes("failed to fetch") || msg.includes("high demand") || msg.includes("invalid json. status: 200")) {
            retryCount++;
            if (retryCount >= 6) {
              setBatchStatus(
                `Server unreachable too many times. Continuing...`,
              );
              await new Promise((r) => setTimeout(r, 2000));
              i++;
              retryCount = 0;
              continue;
            }
            setBatchStatus(`Server busy/timeout (${msg.match(/50[34]/) ? msg.match(/50[34]/)![0] : 'Error'}). Retrying in 10s...`);
            await new Promise((r) => setTimeout(r, 10000));
            continue; // Retry same lesson
          }

          // Other unexpected errors (e.g. JSON parse errors from the model itself)
          retryCount++;
          if (retryCount >= 3) {
            setBatchStatus(`Failed 3 times. Skipping lesson...`);
            await new Promise((r) => setTimeout(r, 2000));
            i++;
            retryCount = 0;
          } else {
            setBatchStatus(`Error: ${msg.substring(0, 30)}... Retrying (${retryCount}/3)...`);
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
      }
    } finally {
      isBatchingRef.current = false;
      setIsBatchGenerating(false);
      setBatchStatus("");
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all saved generated lessons and reset to start? This cannot be undone.",
      )
    ) {
      await localforage.removeItem("polyglot_lessons");
      setLessons(fullLessonIndex);
      setSelectedLesson(null);
    }
  };

  const handleResetHebrew10 = async () => {
    if (!window.confirm("This will reset the first 10 Hebrew A1 lessons to Pending so they can be re-generated. Are you sure?")) return;
    
    setLessons((prev) => {
      const next = prev.map((l) => {
        if (l.language_code === "HE" && l.level === "A1" && l.lesson_number <= 10) {
          return {
            ...l,
            content: undefined,
            story_status: "Pending",
            dialogue_status: "Pending",
            grammar_status: "Pending",
            conjugation_status: "Pending",
            arabic_meaning_status: "Pending",
          };
        }
        return l;
      });
      localforage.setItem("polyglot_lessons", next).catch(console.error);
      return next;
    });
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang);

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-neutral-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-200">
            <Globe2 size={18} />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Polyglot</h1>
            <p className="text-xs text-neutral-500 font-medium tracking-wide">
              Academy Builder
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
              title="Reset All Local Data"
            >
              <Settings className="w-4 h-4" />
              Reset Progress
            </button>
          </div>
          {/* Languages */}
          <div>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <BookOpen size={14} /> Languages
            </h2>
            <div className="space-y-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedLang === lang.code
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg w-5">{getFlag(lang.code)}</span>{" "}
                    {lang.name}
                  </span>
                  {selectedLang === lang.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CEFR Levels */}
          <div>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <Layers size={14} /> CEFR Levels
            </h2>
            <div className="grid grid-cols-2 gap-2 px-1">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`py-2 text-sm font-medium rounded-md border transition-all ${
                    selectedLevel === level
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2">
          <button
            onClick={handleDownloadFullJSON}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 border border-transparent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export All JSON (4,200)
          </button>
          <button
            onClick={handleDownloadFullCSV}
            className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-300 text-neutral-700 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export All CSV (4,200)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Header */}
        <header className="h-16 border-b border-neutral-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide border border-indigo-100 flex items-center gap-2">
              <span className="text-sm">
                {getFlag(currentLangObj?.code || "")}
              </span>
              <span>
                {currentLangObj?.code}-{selectedLevel}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-800">
              {currentLangObj?.name} • {selectedLevel}
            </h2>
            <span className="text-neutral-400 text-sm hidden sm:inline-block">
              {filteredLessons.length} lessons
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-64 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center gap-3">
              {batchStatus && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse border border-amber-100 hidden md:block">
                  {batchStatus}
                </span>
              )}
              <button
                onClick={handleBatchGenerate}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm ${
                  isBatchGenerating
                    ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                <Wand2
                  size={16}
                  className={isBatchGenerating ? "animate-pulse" : ""}
                />
                {isBatchGenerating ? "Stop Auto-Gen" : "Auto-Generate All"}
              </button>
              
              <button
                onClick={handleResetHebrew10}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                title="Reset First 10 Hebrew A1 Lessons"
              >
                Reset HE 1-10
              </button>
            </div>

            <label className="flex items-center gap-2 bg-white border border-neutral-300 text-neutral-700 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm cursor-pointer">
              <span className="flex items-center gap-2">
                <FileText size={16} /> Import JSON
              </span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleUploadCSV}
              />
            </label>
            <button
              onClick={handleDownloadCurrentJSON}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FileText size={16} />
              Export View JSON
            </button>
            <button
              onClick={handleDownloadCurrentCSV}
              className="flex items-center gap-2 bg-white border border-neutral-300 text-neutral-700 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm"
            >
              <FileText size={16} />
              Export View CSV
            </button>
          </div>
        </header>

        {isBatchGenerating && batchProgress.total > 0 && (
          <div className="bg-white border-b border-neutral-200 px-8 py-3 shrink-0 flex flex-col justify-center">
            <div className="flex justify-between items-center text-xs font-medium text-neutral-600 mb-2">
              <span className="text-indigo-700 flex items-center gap-2">
                <Wand2 size={14} className="animate-pulse" /> Auto-Generating
                Lessons...
              </span>
              <span className="text-neutral-500 font-medium">
                {Math.round(
                  (batchProgress.current / Math.max(1, batchProgress.total)) *
                    100,
                )}
                % ({batchProgress.current} / {batchProgress.total} completed)
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60">
              <div
                className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                style={{
                  width: `${(batchProgress.current / Math.max(1, batchProgress.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-neutral-50/50">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-full">
            <div className="overflow-auto flex-1 relative">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-neutral-50/95 backdrop-blur-sm border-b border-neutral-200 text-neutral-500 font-medium z-10">
                  <tr>
                    <th className="px-4 py-3 first:pl-6 w-24">Lesson ID</th>
                    <th className="px-4 py-3 min-w-[200px]">Title</th>
                    <th className="px-4 py-3 text-center">Story</th>
                    <th className="px-4 py-3 text-center">Dialogue</th>
                    <th className="px-4 py-3 text-center">Grammar</th>
                    <th className="px-4 py-3 text-center">Conjugation</th>
                    <th className="px-4 py-3 text-center">Arabic Meaning</th>
                    <th className="px-4 py-3 text-right pr-6">Data Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredLessons.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-12 text-center text-neutral-500"
                      >
                        <BookOpen
                          className="mx-auto mb-3 opacity-20"
                          size={48}
                        />
                        <p className="font-medium text-lg text-neutral-700">
                          No lessons found
                        </p>
                        <p>Try adjusting your search criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLessons.map((lesson) => (
                      <tr
                        key={lesson.lesson_id}
                        onClick={() => setSelectedLesson(lesson)}
                        className="hover:bg-neutral-50/80 hover:shadow-sm cursor-pointer group transition-all"
                      >
                        <td className="px-4 py-3.5 first:pl-6 font-mono text-xs text-neutral-500 bg-white group-hover:bg-transparent">
                          {lesson.lesson_id}
                        </td>
                        <td className="px-4 py-3.5 bg-white group-hover:bg-transparent">
                          <span className="font-medium text-neutral-900 group-hover:text-indigo-700 transition-colors">
                            {lesson.title}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center bg-white group-hover:bg-transparent">
                          <StatusBadge status={lesson.story_status} />
                        </td>
                        <td className="px-4 py-3.5 text-center bg-white group-hover:bg-transparent">
                          <StatusBadge status={lesson.dialogue_status} />
                        </td>
                        <td className="px-4 py-3.5 text-center bg-white group-hover:bg-transparent">
                          <StatusBadge status={lesson.grammar_status} />
                        </td>
                        <td className="px-4 py-3.5 text-center bg-white group-hover:bg-transparent">
                          <StatusBadge status={lesson.conjugation_status} />
                        </td>
                        <td className="px-4 py-3.5 text-center bg-white group-hover:bg-transparent">
                          <StatusBadge status={lesson.arabic_meaning_status} />
                        </td>
                        <td className="px-4 py-3.5 bg-white group-hover:bg-transparent pr-6">
                          <div className="flex items-center justify-end gap-3 text-xs text-neutral-500">
                            <span
                              className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded"
                              title="Vocabulary Count"
                            >
                              <span className="font-semibold text-neutral-900">
                                {lesson.vocabulary_count}
                              </span>{" "}
                              Vocab
                            </span>
                            <span
                              className="flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded"
                              title="Expressions Count"
                            >
                              <span className="font-semibold text-neutral-900">
                                {lesson.expressions_count}
                              </span>{" "}
                              Expr
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <LessonDrawer
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
        langName={currentLangObj?.name || "Language"}
        onGenerate={handleGenerateLesson}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-500 border border-neutral-200/50">
        <Circle size={10} strokeWidth={3} className="text-neutral-400" />{" "}
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50">
      <CheckCircle2 size={10} strokeWidth={3} /> Generated
    </span>
  );
}

function getFlag(code: string) {
  const flags: Record<string, string> = {
    ES: "🇪🇸",
    FR: "🇫🇷",
    DE: "🇩🇪",
    IT: "🇮🇹",
    PT: "🇵🇹",
    JA: "🇯🇵",
    ZH: "🇨🇳",
  };
  return flags[code] || "🌐";
}
