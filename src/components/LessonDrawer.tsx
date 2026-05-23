import React, { useState, useMemo } from 'react';
import { X, FileText, MessageSquare, Book, Table, Type, List, Wand2, Loader2, Sparkles, ChevronRight, Volume2, Gamepad2 } from 'lucide-react';
import { LessonIndex } from '../lib/academy';

interface LessonDrawerProps {
  lesson: LessonIndex | null;
  onClose: () => void;
  langName: string;
  onGenerate: (lesson: LessonIndex) => Promise<void>;
}

export default function LessonDrawer({ lesson, onClose, langName, onGenerate }: LessonDrawerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [transLang, setTransLang] = useState<'arabic'|'english'>('english');

  const vocabItems = useMemo(() => {
    if (!lesson?.content) return [];
    const content = lesson.content;
    const items: { word: string; translation: string; ipa: string; type: string }[] = [];
    if (content.vocabulary) {
      for (const v of content.vocabulary) {
        if (v.word) items.push({ word: v.word, translation: transLang === 'arabic' ? v.arabic : v.english, ipa: v.ipa || '', type: v.type || '' });
        if (v.plural) items.push({ word: v.plural, translation: transLang === 'arabic' ? v.arabic : v.english, ipa: v.ipa || '', type: v.type || '' });
      }
    }
    if (content.expressions) {
      for (const e of content.expressions) {
        if (e.expression) items.push({ word: e.expression, translation: transLang === 'arabic' ? e.arabic : e.english, ipa: '', type: 'expression' });
      }
    }
    // Filter the items here so we return a clean list
    return items.filter(i => i.word && i.word.length > 2).sort((a, b) => b.word.length - a.word.length);
  }, [lesson?.content, transLang]);

  if (!lesson) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(lesson);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('429')) {
         alert('API Rate Limit exceeded. Please wait a moment and try again, or check your Gemini API key plan.');
      } else {
         alert(`Failed to generate lesson: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const hasContent = !!lesson.content;
  const content = lesson.content;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 font-mono">
                {lesson.lesson_id}
              </span>
              <span className="text-sm font-medium text-neutral-500">{langName} • {lesson.level}</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900">{lesson.title}</h2>
          </div>
          <div className="flex bg-neutral-200 p-1 rounded-lg mr-4">
            <button onClick={() => setTransLang('english')} className={`px-3 py-1 text-xs font-semibold rounded ${transLang === 'english' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'}`}>EN</button>
            <button onClick={() => setTransLang('arabic')} className={`px-3 py-1 text-xs font-semibold rounded ${transLang === 'arabic' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'}`}>AR</button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50/30 text-right" dir="auto">
          {!hasContent ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
               <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 relative">
                 <Sparkles className="absolute -top-2 -right-2 text-amber-400" size={20} />
                 <Wand2 size={32} />
               </div>
               <h3 className="text-xl font-semibold text-neutral-900 mb-2">Lesson Not Generated</h3>
               <p className="text-sm text-neutral-500 max-w-md mb-8">
                 This lesson is currently pending. Click below to use the AI engine to generate the <strong>deep, professional</strong> content for exactly this topic and level.
               </p>
               <button 
                 onClick={handleGenerate}
                 disabled={isGenerating}
                 className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                 {isGenerating ? 'Generating Content...' : 'Generate with AI'}
               </button>
            </div>
          ) : (
            <div className="space-y-8 text-left" dir="ltr">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200 text-sm flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" />
                  Successfully generated deeply professional lesson data.
                </span>
              </div>

              {/* Story */}
              <Section icon={<FileText />} title="1. Written Story">
                <div className="space-y-4">
                  <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                    <p className="text-neutral-800 leading-relaxed font-serif text-lg">
                      <Highlighter text={content.story.text} items={vocabItems} langCode={lesson.language_code} />
                    </p>
                    <SpeechPlayer text={content.story.text} langCode={lesson.language_code} />
                    {transLang === 'arabic' ? (
                      <div className="mt-4 pt-4 border-t border-neutral-100" dir="rtl">
                        <p className="text-neutral-600 font-arabic text-lg leading-relaxed">{content.story.arabic}</p>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-neutral-100" dir="ltr">
                        <p className="text-neutral-600 text-lg leading-relaxed">{content.story.english || ''}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Dialogue */}
              <Section icon={<MessageSquare />} title="2. Written Dialogue">
                 <div className="space-y-3">
                   {content.dialogue.map((line: any, idx: number) => (
                     <div key={idx} className="bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
                       <div className="flex items-center gap-3 mb-2">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                           {line.speaker[0]?.toUpperCase() || 'A'}
                         </div>
                         <span className="font-semibold text-neutral-900 text-sm">{line.speaker}</span>
                       </div>
                       <div className="ml-11">
                         <p className="text-neutral-800 mb-2">
                           <Highlighter text={line.text} items={vocabItems} langCode={lesson.language_code} />
                         </p>
                         <SpeechPlayer text={line.text} langCode={lesson.language_code} />
                         {transLang === 'arabic' ? (
                           <p className="text-neutral-500 text-sm mt-3" dir="rtl">{line.arabic}</p>
                         ) : (
                           <p className="text-neutral-500 text-sm mt-3" dir="ltr">{line.english || ''}</p>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
              </Section>

              <div className="grid grid-cols-1 gap-6">
                {/* Grammar */}
                <Section icon={<Book />} title={`3. Grammar Points (${content.grammar_points?.length || 0})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.grammar_points?.map((gp: any, idx: number) => (
                      <div key={idx} className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                        <h4 className="font-semibold text-neutral-900 mb-2">{gp.title}</h4>
                        <p className="text-sm text-neutral-700 mb-2">{gp.explanation}</p>
                        {transLang === 'arabic' ? (
                          <p className="text-sm text-neutral-500 mb-4" dir="rtl">{gp.arabic_explanation}</p>
                        ) : (
                          <p className="text-sm text-neutral-500 mb-4" dir="ltr">{gp.english_explanation || ''}</p>
                        )}
                        
                        <div className="space-y-2 mt-4 bg-neutral-50 p-3 rounded">
                          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Examples</span>
                          {gp.examples?.map((ex: any, i: number) => (
                            <div key={i} className="text-sm">
                              <span className="text-neutral-800">{ex.text}</span>
                              <span className="text-neutral-400 mx-2">—</span>
                              {transLang === 'arabic' ? (
                                <span className="text-neutral-600" dir="rtl">{ex.arabic}</span>
                              ) : (
                                <span className="text-neutral-600" dir="ltr">{ex.english || ''}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                 {/* Conjugation */}
                 <Section icon={<Table />} title={`4. Conjugations (${content.conjugations?.length || 0})`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.conjugations?.map((conj: any, cIdx: number) => (
                      <div key={cIdx} className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center">
                           <div>
                             <span className="font-bold text-indigo-900 block">{conj.verb}</span>
                             {transLang === 'arabic' ? (
                               <span className="text-xs text-indigo-600" dir="rtl">{conj.arabic_meaning}</span>
                             ) : (
                               <span className="text-xs text-indigo-600" dir="ltr">{conj.english_meaning || ''}</span>
                             )}
                           </div>
                        </div>
                        <div className="p-3 space-y-4 max-h-64 overflow-y-auto">
                          {conj.tenses?.map((t: any, tIdx: number) => (
                            <div key={tIdx}>
                              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 border-b pb-1">{t.tense_name}</div>
                              <table className="w-full text-sm">
                                <tbody>
                                  {t.forms?.map((form: string, i: number) => {
                                    const parts = form.split(' ');
                                    const pronoun = parts[0];
                                    const verbForm = parts.slice(1).join(' ');
                                    return (
                                    <tr key={i} className="border-b last:border-0 border-neutral-100">
                                      <td className="py-1 text-neutral-500 w-1/3">{pronoun}</td>
                                      <td className="py-1 text-indigo-700 font-medium">{verbForm}</td>
                                    </tr>
                                  )})}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Vocabulary */}
              <Section icon={<Type />} title={`5. New Vocabulary (${content.vocabulary.length})`}>
                <div className="bg-white border text-sm border-neutral-200 rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-50 font-medium text-neutral-600 border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-4 w-1/3">Word</th>
                        <th className="py-3 px-4 w-1/4">Type/Phonetics</th>
                        <th className="py-3 px-4 text-right">Translation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700">
                      {content.vocabulary.map((vocab: any, i: number) => {
                         let wordColorClass = 'text-neutral-900';
                         const tLower = (vocab.type || '').toLowerCase();
                         if (tLower.includes('noun')) wordColorClass = 'text-red-600';
                         else if (tLower.includes('adj')) wordColorClass = 'text-blue-600';
                         else if (tLower.includes('verb')) wordColorClass = 'text-green-600';

                         return (
                        <React.Fragment key={i}>
                          <tr className="hover:bg-neutral-50 group border-b border-neutral-50 last:border-0 relative">
                            <td className={`py-3 px-4 font-medium ${wordColorClass}`}>
                              <div className="flex flex-col">
                                <span>{vocab.article ? `${vocab.article} ` : ''}{vocab.word}</span>
                                {vocab.plural && <span className="text-xs text-neutral-400 font-normal">pl: {vocab.plural}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <span className="bg-neutral-100 px-2 py-1 rounded text-neutral-600 mb-1 inline-block">{vocab.type}</span>
                              {vocab.ipa && <div className="text-neutral-500 font-mono mt-1">/{vocab.ipa}/</div>}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-emerald-700">
                              {transLang === 'arabic' ? <span dir="rtl">{vocab.arabic}</span> : <span dir="ltr">{vocab.english || ''}</span>}
                            </td>
                          </tr>
                          {(vocab.example_text || vocab.example_arabic || vocab.example_english) && (
                            <tr className="bg-neutral-50/50">
                              <td colSpan={3} className="px-4 py-2 text-xs text-neutral-500 border-b border-neutral-100">
                                <div className="flex flex-col gap-1 w-full text-left">
                                  <span className="italic">"{vocab.example_text}"</span>
                                  {transLang === 'arabic' ? (
                                    <span className="font-arabic text-neutral-400" dir="rtl">{vocab.example_arabic}</span>
                                  ) : (
                                    <span className="text-neutral-400" dir="ltr">{vocab.example_english || ''}</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Expressions */}
              <Section icon={<List />} title={`6. Practical Expressions (${content.expressions?.length || 0})`}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {content.expressions?.map((expr: any, i: number) => (
                     <Flashcard key={i} expr={expr} transLang={transLang} />
                   ))}
                 </div>
              </Section>

              {/* Quiz */}
              {content.quiz && content.quiz.length > 0 && (
                <Section icon={<Sparkles />} title={`7. Quiz (${content.quiz.length} Questions)`}>
                  <div className="space-y-6">
                    {content.quiz.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-white border text-sm border-neutral-200 rounded-lg p-5 shadow-sm">
                        <div className="font-bold text-neutral-800 mb-4">{qIdx + 1}. {q.question}</div>
                        <div className="space-y-2">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className={`p-3 rounded border text-sm flex gap-3 ${oIdx === q.answer_index ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-neutral-200 text-neutral-600'}`}>
                              <span className={`font-bold ${oIdx === q.answer_index ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                           <div className="mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500 italic">
                             <span className="font-semibold text-neutral-600 not-italic mr-1">Explanation:</span> {q.explanation}
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Memory Review / Vocabulary Quiz Game */}
              <VocabularyQuiz vocabulary={content.vocabulary} transLang={transLang} />

              {/* AI Chatbot Tutor */}
              <LessonChatbot lesson={content} />
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-neutral-300 bg-white rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors shadow-sm">
            Close Preview
          </button>
        </div>

      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 font-bold text-lg text-neutral-800 mb-4 pb-2 border-b border-neutral-200">
        <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-md">{icon}</span>
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function Flashcard({ expr, transLang }: { expr: any; transLang: 'arabic'|'english'; key?: number | string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="relative h-32 w-full cursor-pointer group perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div 
        className={`absolute inset-0 w-full h-full duration-500 preserve-3d shadow-sm rounded-lg ${flipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-neutral-200 rounded-lg p-4 flex flex-col justify-center items-center text-center">
          <div className="font-bold text-neutral-900 text-lg mb-1">{expr.expression}</div>
          <div className="text-xs text-neutral-400 uppercase tracking-widest font-medium mt-2">Click to flip</div>
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-indigo-600 border border-indigo-700 rounded-lg p-4 flex flex-col justify-center items-center text-center text-white">
          {transLang === 'arabic' ? (
            <div className="font-bold text-lg mb-2" dir="rtl">{expr.arabic}</div>
          ) : (
            <div className="font-bold text-lg mb-2" dir="ltr">{expr.english || ''}</div>
          )}
          <div className="text-sm text-indigo-200 italic leading-tight mt-1">
            "{expr.usage_example}"
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeechPlayer({ text, langCode }: { text: string; langCode: string }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter by language code (e.g. 'fr' matches 'fr-FR', 'fr-CA', etc.)
      const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
      if (langVoices.length > 0) {
        setVoices(langVoices);
      } else {
        // fallback to all voices
        setVoices(allVoices);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [langCode]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!text || voices.length === 0) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    
    // Sometimes voices are buggy and don't fire 'end' event. So we just set it true here
    setIsPlaying(true);

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  if (voices.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2" dir="ltr">
      <button 
        onClick={togglePlay}
        className={`p-1.5 rounded-full transition-colors ${isPlaying ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        title="Read text"
      >
        <Volume2 size={16} />
      </button>
      <select 
        value={selectedVoiceIndex} 
        onChange={(e) => {
          setSelectedVoiceIndex(Number(e.target.value));
          if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); }
        }}
        className="text-xs bg-transparent border-none text-neutral-500 focus:ring-0 max-w-[120px] truncate"
      >
        {voices.map((v, i) => (
          <option key={i} value={i}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Highlighter({ text, items, langCode }: { text: string; items: { word: string; translation: string; ipa: string; type: string }[]; langCode: string }) {
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  if (!text || !items || items.length === 0) return <>{text}</>;

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const vocabPattern = items.map(i => escapeRegExp(i.word)).join('|');
  const regex = new RegExp(`(^|[^\\p{L}])(${vocabPattern})(?=[^\\p{L}]|$)`, 'giu');

  const parts = [];
  let lastIndex = 0;
  let match;

  const handleWordAction = (word: string, translation: string, type: string) => {
    // Attempt pronunciation
    window.speechSynthesis.cancel();
    const allVoices = window.speechSynthesis.getVoices();
    const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
    
    const utterance = new SpeechSynthesisUtterance(word);
    if (langVoices.length > 0) {
      utterance.voice = langVoices[0];
    }
    window.speechSynthesis.speak(utterance);
  };

  while ((match = regex.exec(text)) !== null) {
    const pre = match[1];
    const word = match[2];
    const matchIndex = match.index + pre.length;

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const lowerWord = word.toLowerCase();
    const foundItem = items.find(i => i.word.toLowerCase() === lowerWord);

    if (foundItem) {
      const hash = `${matchIndex}-${word}`;
      
      let wordColorClass = 'text-neutral-900 border-neutral-400';
      const tLower = (foundItem.type || '').toLowerCase();
      if (tLower.includes('noun')) wordColorClass = 'text-red-700 bg-red-50 border-red-300';
      else if (tLower.includes('adj')) wordColorClass = 'text-blue-700 bg-blue-50 border-blue-300';
      else if (tLower.includes('verb')) wordColorClass = 'text-green-700 bg-green-50 border-green-300';
      else wordColorClass = 'text-indigo-900 bg-indigo-50 border-indigo-400';
      
      parts.push(
        <span 
          key={matchIndex} 
          className={`relative inline-block cursor-pointer font-medium px-0.5 mx-0.5 border-b-2 rounded-sm transition-colors hover:bg-opacity-70 ${wordColorClass}`}
          onMouseEnter={() => {
            setHoveredHash(hash);
            handleWordAction(word, foundItem.translation, foundItem.type);
          }}
          onMouseLeave={() => setHoveredHash(null)}
          onClick={() => handleWordAction(word, foundItem.translation, foundItem.type)}
        >
          {word}
          {hoveredHash === hash && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-neutral-900 text-white text-xs font-sans rounded shadow-xl z-50 whitespace-nowrap pointer-events-none flex flex-col gap-1 min-w-[max-content]">
              <span className="font-bold flex justify-between gap-4">
                <span>{foundItem.translation}</span>
                {foundItem.ipa && <span className="text-neutral-400 font-mono italic font-normal">/{foundItem.ipa}/</span>}
              </span>
              {foundItem.type && <span className="text-neutral-400 text-[10px] uppercase tracking-wide">{foundItem.type}</span>}
              
              <svg className="absolute text-neutral-900 h-2 w-2 left-1/2 -bottom-2 -translate-x-1/2 -translate-y-1/2" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
            </span>
          )}
        </span>
      );
    } else {
      parts.push(word);
    }

    lastIndex = matchIndex + word.length;
    if (match.index === regex.lastIndex) regex.lastIndex++;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}


function VocabularyQuiz({ vocabulary, transLang }: { vocabulary: any[], transLang: 'arabic'|'english' }) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const startQuiz = () => {
    if (!vocabulary || vocabulary.length < 4) return;
    const numQuestions = Math.min(5, vocabulary.length);
    const shuffled = [...vocabulary].sort(() => 0.5 - Math.random());
    const selectedVocab = shuffled.slice(0, numQuestions);

    const generatedQuestions = selectedVocab.map(vocab => {
       const others = vocabulary.filter(v => v.word !== vocab.word);
       const shuffledOthers = others.sort(() => 0.5 - Math.random());
       const incorrects = shuffledOthers.slice(0, 3);
       
       const shuffleOrder = [0, 1, 2, 3].sort(() => 0.5 - Math.random());
       
       return {
         word: (vocab.article ? `${vocab.article} ` : '') + vocab.word,
         correctVocab: vocab,
         incorrectVocabs: incorrects,
         shuffleOrder
       };
    });

    setQuestions(generatedQuestions);
    setStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
  };

  if (!vocabulary || vocabulary.length < 4) {
    return null;
  }

  if (!started) {
     return (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center shadow-sm">
           <h4 className="text-lg font-bold text-neutral-800 mb-2 flex items-center justify-center gap-2">
             <Gamepad2 className="text-indigo-600" size={24} /> Vocabulary Mini-Game
           </h4>
           <p className="text-sm text-neutral-500 mb-4">Test your memory on the new vocabulary words from this lesson.</p>
           <button onClick={startQuiz} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
             Start Review
           </button>
        </div>
     );
  }

  if (isFinished) {
     return (
       <div className="bg-white p-6 rounded-xl border border-neutral-200 text-center shadow-sm">
           <div className="text-5xl mb-4">{score === questions.length ? '🏆' : '👏'}</div>
           <h4 className="text-2xl font-bold text-neutral-800 mb-2">Quiz Complete!</h4>
           <p className="text-lg text-neutral-600 mb-6">You scored <span className="font-bold text-indigo-600">{score}</span> out of {questions.length}</p>
           <button onClick={startQuiz} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
             Play Again
           </button>
       </div>
     );
  }

  const question = questions[currentIndex];

  const handleOptionClick = (index: number, isCorrect: boolean) => {
     if (selectedOption !== null) return;
     setSelectedOption(index);
     if (isCorrect) {
       setScore(s => s + 1);
     }
     setTimeout(() => {
        if (currentIndex < questions.length - 1) {
           setCurrentIndex(i => i + 1);
           setSelectedOption(null);
        } else {
           setIsFinished(true);
        }
     }, 1500);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm relative">
       <div className="absolute top-4 right-4 text-xs font-bold text-neutral-400">
         {currentIndex + 1} / {questions.length}
       </div>
       <h4 className="text-center text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-4">What does this word mean?</h4>
       <div className="text-center text-3xl font-bold text-indigo-900 mb-8 py-4 bg-indigo-50 rounded-lg">
          {question.word}
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.shuffleOrder.map((mappedIndex: number, idx: number) => {
            const isCorrect = mappedIndex === 0;
            const vocab = isCorrect ? question.correctVocab : question.incorrectVocabs[mappedIndex - 1];
            const text = transLang === 'arabic' ? vocab.arabic : (vocab.english || '');
            
            let btnClass = "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50";
            if (selectedOption !== null) {
               if (isCorrect) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm z-10";
               else if (idx === selectedOption && !isCorrect) btnClass = "bg-red-50 border-red-500 text-red-800 opacity-80";
               else btnClass = "bg-white border-neutral-200 text-neutral-400 opacity-50";
            }
            return (
               <button 
                  key={idx} 
                  disabled={selectedOption !== null}
                  onClick={() => handleOptionClick(idx, isCorrect)}
                  className={`p-4 border rounded-lg font-medium transition-all text-left ${btnClass}`}
                  dir={transLang === 'arabic' ? 'rtl' : 'ltr'}
               >
                 {text}
               </button>
            )
          })}
       </div>
    </div>
  );
}

function LessonChatbot({ lesson }: { lesson: any }) {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: userMsg,
          context: lesson
        })
      });
      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();
      setMessages(prev => [...prev, {role: 'assistant', text: data.text}]);
    } catch (e) {
      setMessages(prev => [...prev, {role: 'assistant', text: 'Sorry, I encountered an error. Please try again.'}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border text-sm border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col mt-6" style={{ height: '500px' }}>
      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-600" />
            <h4 className="font-bold text-indigo-900">AI Language Tutor</h4>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
         {messages.length === 0 && (
            <div className="text-center text-neutral-400 mt-10">
               Ask me anything about this lesson's language, grammar, or vocabulary!
            </div>
         )}
         {messages.map((m, i) => (
           <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-neutral-200 text-neutral-700 rounded-bl-none shadow-sm'}`}>
                 <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
           </div>
         ))}
         {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-neutral-200 text-neutral-500 rounded-xl rounded-bl-none px-4 py-2 flex items-center gap-2 shadow-sm">
                 <Loader2 size={14} className="animate-spin" /> Thinking...
               </div>
            </div>
         )}
      </div>
      <div className="p-3 border-t border-neutral-200 bg-white flex gap-2">
         <input 
            type="text"
            className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
         />
         <button 
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 hover:bg-indigo-700 transition"
         >
            Send
         </button>
      </div>
    </div>
  );
}
