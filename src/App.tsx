import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Copy, Check, ChevronDown, Info, Loader2, Trash2, Wand2 } from 'lucide-react';
import { generatePrompts, GeneratedPrompt, GeneratePromptParams, enhanceIdea } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';

const MODELS = ['ChatGPT / Claude', 'Midjourney', 'Stable Diffusion', 'GitHub Copilot', 'Gemini'];
const LANGUAGES = ['English', 'Русский', 'Українська', 'Español', 'Français', 'Deutsch'];
const STRUCTURES = ['Default (Paragraphs)', 'Single line (No breaks)', 'Raw text only', 'Bullet points', 'JSON Format'];
const TONES = ['Neutral', 'Professional', 'Creative', 'Direct / Concise', 'Humorous'];

export default function App() {
  const [idea, setIdea] = useState('');
  const [targetModel, setTargetModel] = useState(MODELS[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [structure, setStructure] = useState(STRUCTURES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [variantsCount, setVariantsCount] = useState(1);
  const [includeNegative, setIncludeNegative] = useState(false);
  const [includeRole, setIncludeRole] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [results, setResults] = useState<GeneratedPrompt[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedNegIndex, setCopiedNegIndex] = useState<number | null>(null);

  // Load history from local storage
  const [history, setHistory] = useState<{idea: string, results: GeneratedPrompt[]}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('prompt_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    
    setIsGenerating(true);
    setResults([]);
    
    try {
      const params: GeneratePromptParams = {
        idea,
        targetModel,
        language,
        variantsCount,
        structure,
        includeNegative,
        includeRole,
        tone
      };
      
      const generated = await generatePrompts(params);
      setResults(generated);
      
      const newHistory = [{ idea, results: generated }, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('prompt_history', JSON.stringify(newHistory));
      
    } catch (error) {
      console.error("Error generating:", error);
      const message = error instanceof Error ? error.message : "Failed to generate prompts. Please try again.";
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => {
    if (!idea.trim()) return;
    setIsEnhancing(true);
    try {
      const improved = await enhanceIdea(idea);
      setIdea(improved);
    } catch (error) {
      console.error("Failed to enhance idea:", error);
      const message = error instanceof Error ? error.message : "Failed to enhance idea. Please try again.";
      alert(message);
    } finally {
      setIsEnhancing(false);
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

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('prompt_history');
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="w-full max-w-4xl mb-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">XaniPromt</h1>
        <p className="text-gray-500 text-sm">Describe your idea, and we'll craft the perfect prompt for you.</p>
      </header>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="idea" className="block text-sm font-medium text-gray-700">
                Your Task / Idea
              </label>
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !idea.trim()}
                className="text-xs flex items-center text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                Enhance Idea
              </button>
            </div>
            <textarea
              id="idea"
              rows={6}
              className="w-full rounded-xl border-gray-200 shadow-sm focus:border-black focus:ring-black sm:text-sm p-4 bg-gray-50 resize-none transition-colors"
              placeholder="E.g., I want an image of a futuristic city with flying cars, cyberpunk style, neon lights..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !idea.trim()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Crafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="-ml-1 mr-2 h-4 w-4" />
                    Generate Prompts
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Generated Prompts</h2>
                
                {results.map((res, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    
                    {res.explanation && (
                      <div className="flex items-start text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <p>{res.explanation}</p>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Prompt {idx + 1}</span>
                        <button
                          onClick={() => copyToClipboard(res.prompt, idx)}
                          className="text-gray-400 hover:text-gray-900 transition-colors"
                          title="Copy Prompt"
                        >
                          {copiedIndex === idx ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-mono text-sm text-gray-800 whitespace-pre-wrap">
                        {res.prompt}
                      </div>
                    </div>

                    {res.negativePrompt && (
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Negative Prompt</span>
                          <button
                            onClick={() => copyToClipboard(res.negativePrompt!, idx, true)}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                            title="Copy Negative Prompt"
                          >
                            {copiedNegIndex === idx ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 font-mono text-sm text-red-800 whitespace-pre-wrap">
                          {res.negativePrompt}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-4 w-4 text-gray-400 mr-2" />
              <h2 className="text-sm font-medium text-gray-900">Configuration</h2>
            </div>
            
            <div className="space-y-5">
              
              {/* Target Model */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Target AI</label>
                <select
                  value={targetModel}
                  onChange={(e) => setTargetModel(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-lg bg-gray-50"
                >
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Output Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-lg bg-gray-50"
                >
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Structure */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Structure</label>
                <select
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-lg bg-gray-50"
                >
                  {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tone / Style</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-lg bg-gray-50"
                >
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Variants Count */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                  <span>Variants</span>
                  <span className="text-gray-900">{variantsCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={variantsCount}
                  onChange={(e) => setVariantsCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center">
                  <input
                    id="include-role"
                    type="checkbox"
                    checked={includeRole}
                    onChange={(e) => setIncludeRole(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="include-role" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Include Role (e.g., "Act as...")
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="negative-prompt"
                    type="checkbox"
                    checked={includeNegative}
                    onChange={(e) => setIncludeNegative(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="negative-prompt" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Include Negative Prompt
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-900">Recent History</h2>
                <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="text-xs p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors truncate"
                    onClick={() => {
                      setIdea(item.idea);
                      setResults(item.results);
                    }}
                    title={item.idea}
                  >
                    {item.idea}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
