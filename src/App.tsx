import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Copy, Check, Info, Loader2, Trash2, Wand2, RotateCcw, Plus, X } from 'lucide-react';
import { generatePrompts, GeneratedPrompt, GeneratePromptParams, enhanceIdea, getEnhancementSuggestions } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';

const MODELS = ['ChatGPT / Claude', 'Midjourney', 'Stable Diffusion', 'GitHub Copilot', 'Gemini'];
const LANGUAGES = ['English', 'Русский', 'Українська', 'Español', 'Français', 'Deutsch'];
const STRUCTURES = ['Default (Paragraphs)', 'Single line (No breaks)', 'Raw text only', 'Bullet points', 'JSON Format'];
const TONES = ['Neutral', 'Professional', 'Creative', 'Direct / Concise', 'Humorous'];

interface HistoryItem {
  id: string;
  idea: string;
  results: GeneratedPrompt[];
  timestamp: number;
}

export default function App() {
  const [idea, setIdea] = useState('');
  const [originalIdea, setOriginalIdea] = useState('');
  const [targetModel, setTargetModel] = useState(MODELS[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [structure, setStructure] = useState(STRUCTURES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [variantsCount, setVariantsCount] = useState(1);
  const [includeNegative, setIncludeNegative] = useState(false);
  const [includeRole, setIncludeRole] = useState(true);
  const [responseStyle, setResponseStyle] = useState<'Serious' | 'Simple'>('Serious');
  const [noExtraText, setNoExtraText] = useState(false);
  const [noFormatting, setNoFormatting] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedPrompt[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedNegIndex, setCopiedNegIndex] = useState<number | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('xani_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('xani_history_v2', JSON.stringify(newHistory));
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    setResults([]);
    try {
      const params: GeneratePromptParams = {
        idea, targetModel, language, variantsCount, structure, includeNegative, includeRole, tone,
        responseStyle, noExtraText, noFormatting
      };
      const generated = await generatePrompts(params);
      if (!Array.isArray(generated) || generated.length === 0) {
        alert("No prompt was returned. Please try again.");
        return;
      }
      setResults(generated);
      const newItem: HistoryItem = { id: crypto.randomUUID(), idea, results: generated, timestamp: Date.now() };
      const newHistory = [newItem, ...history].slice(0, 20);
      saveHistory(newHistory);
    } catch (error) {
      console.error("Error generating:", error);
      const message = error instanceof Error ? error.message : "Failed to generate prompts.";
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => {
    if (!idea.trim()) return;
    setIsEnhancing(true);
    setOriginalIdea(idea);
    try {
      const [improved, newSuggestions] = await Promise.all([
        enhanceIdea(idea),
        getEnhancementSuggestions(idea)
      ]);
      setIdea(improved);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to enhance idea:", error);
      const message = error instanceof Error ? error.message : "Failed to enhance idea.";
      alert(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAddSuggestion = (suggestion: string) => {
    setIdea(prev => prev.trim() + ", " + suggestion);
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
  };

  const clearHistory = () => {
    if (confirm("Clear all history?")) {
      saveHistory([]);
    }
  };

  const copyToClipboard = (text: string, index: number, isNegative: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isNegative) {
      setCopiedNegIndex(index);
      setTimeout(() => setCopiedNegIndex(null), 2000);
    } else {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <header className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">XaniPromt</h1>
        <p className="text-gray-500 text-sm">Minimalist prompt engineering for everyone.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content (Left) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Input Card */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <label htmlFor="idea" className="block text-sm font-medium text-gray-700">
                Your Task / Idea
              </label>
              <div className="flex gap-3">
                {originalIdea && (
                  <button onClick={() => { setIdea(originalIdea); setSuggestions([]); }} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                )}
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing || !idea.trim()}
                  className="text-xs flex items-center text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                  Enhance Idea
                </button>
              </div>
            </div>

            <textarea
              id="idea"
              rows={6}
              className="w-full rounded-xl border-gray-200 shadow-sm focus:border-black focus:ring-black sm:text-sm p-4 bg-gray-50 resize-none transition-colors"
              placeholder="E.g., A portrait of a futuristic explorer..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => handleAddSuggestion(s)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 flex items-center gap-1 transition-colors">
                    <Plus className="h-3 w-3" /> {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !idea.trim()}
                className="w-full px-8 py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </button>
            </div>
          </section>

          {/* Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Results</h2>
                {results.map((res, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    {res.explanation && (
                      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" /> <p>{res.explanation}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prompt {idx + 1}</span>
                        <button onClick={() => copyToClipboard(res.prompt, idx)} className="text-gray-400 hover:text-gray-900 transition-colors">
                          {copiedIndex === idx ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-mono text-sm text-gray-800 whitespace-pre-wrap">{res.prompt}</div>
                    </div>
                    {res.negativePrompt && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Negative Prompt</span>
                          <button onClick={() => copyToClipboard(res.negativePrompt!, idx, true)} className="text-gray-400 hover:text-gray-900 transition-colors">
                            {copiedNegIndex === idx ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="p-4 bg-red-50/30 rounded-xl border border-red-100 font-mono text-sm text-red-800 whitespace-pre-wrap">{res.negativePrompt}</div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Recent History</h2>
                <button onClick={clearHistory} className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-wider transition-colors">
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map((item) => (
                  <div key={item.id} onClick={() => { setIdea(item.idea); setResults(item.results); }} className="group relative p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-gray-200 transition-all shadow-sm">
                    <p className="text-xs text-gray-600 line-clamp-2 pr-8">{item.idea}</p>
                    <button 
                      onClick={(e) => deleteHistoryItem(item.id, e)} 
                      className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete from history"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar (Right) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target AI</label>
                <select value={targetModel} onChange={(e) => setTargetModel(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-black focus:ring-black">
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-black focus:ring-black">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Structure</label>
                <select value={structure} onChange={(e) => setStructure(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-black focus:ring-black">
                  {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-black focus:ring-black">
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Variants</label>
                  <span className="text-xs font-medium text-gray-600">{variantsCount}</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={variantsCount} 
                  onChange={(e) => setVariantsCount(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" 
                />
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Response Style</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setResponseStyle('Serious')}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${responseStyle === 'Serious' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >
                    Serious
                  </button>
                  <button 
                    onClick={() => setResponseStyle('Simple')}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-all ${responseStyle === 'Simple' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >
                    Simple
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={includeRole} onChange={(e) => setIncludeRole(e.target.checked)} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
                  <span className="text-xs text-gray-600">Include Role</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={includeNegative} onChange={(e) => setIncludeNegative(e.target.checked)} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
                  <span className="text-xs text-gray-600">Negative Prompt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={noExtraText} onChange={(e) => setNoExtraText(e.target.checked)} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
                  <span className="text-xs text-gray-600">No Extra Text</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={noFormatting} onChange={(e) => setNoFormatting(e.target.checked)} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
                  <span className="text-xs text-gray-600">No Formatting</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
