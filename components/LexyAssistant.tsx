import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface LexyAssistantProps {
  user: User;
  onSpendTokens: (amount: number, reason?: string) => Promise<boolean>;
  onUserUpdate: (partial: Partial<User>) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const PREBUILT_PROMPTS = [
  "Explain the meaning of ",
  "In what context can I use ",
  "What are some other meanings of ",
  "Give me synonyms and antonyms for "
];

const LexyAssistant: React.FC<LexyAssistantProps> = ({ user, onSpendTokens, onUserUpdate }) => {
  // No ref needed - we only pass partial updates to onUserUpdate so tokens are never overwritten

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Greetings, ${user.username}. I am Lexy, your erudite companion. How may I illuminate the nuances of language for you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Check tokens before sending
    const hasEnoughTokens = await onSpendTokens(40, "Lexy Consultation");
    if (!hasEnoughTokens) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm afraid you don't have enough Scholar Tokens for a consultation. Please earn more tokens by studying your collections! (Costs 40 tokens)"
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const newUsage = await storageService.incrementLimitUsage(user, 'lexy_prompts_used');
    if (newUsage === null) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm exhausted for the day! You have reached your daily limit of 10 consultations."
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Only pass the changed field so mergeUser in App.tsx preserves the token balance
    onUserUpdate({ lexy_prompts_used: newUsage });
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a prompt that sets Lexy's persona
      const prompt = `You are Lexy, a professional, highly erudite, and sophisticated AI assistant specializing in linguistics, vocabulary, and etymology. 
      You help users understand words deeply. 
      
      CRITICAL INSTRUCTIONS:
      1. Explain everything in very plain, simple language, like you are explaining it to a child.
      2. Use simple examples and analogies.
      3. Keep your answers AS BRIEF AS POSSIBLE. Be clear and direct.
      4. DO NOT use emojis.
      5. DO NOT use informal language or slang. Maintain a polite, academic, but accessible tone.
      6. DO NOT use markdown headings (e.g., #, ##, ###).
      7. USE bold text (**word**) for emphasis.
      8. USE italic text (*example*) for examples.
      9. USE bulleted lists (-) if you need to list multiple items.
      
      User asks: "${text}"
      
      Respond thoughtfully and comprehensively following the instructions above.`;

      const response = await geminiService.generateText(prompt);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Lexy failed to respond:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I seem to be experiencing a temporary cognitive lapse. Could you please rephrase your inquiry?"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-purple-500 text-white rounded-full shadow-2xl shadow-purple-500/40 flex items-center justify-center hover:scale-110 transition-transform z-40 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open Lexy Assistant"
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background animate-pulse"></div>
      </button>

      {/* Assistant Panel */}
      <div 
        className={`fixed bottom-4 right-4 w-[calc(100%-3rem)] md:w-[400px] h-[75vh] md:h-[600px] bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-surfaceHighlight rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-text flex items-center gap-2">
                Lexy <Sparkles className="w-3 h-3 text-purple-500" />
              </h3>
              <p className="text-[10px] text-muted uppercase tracking-widest flex items-center justify-between w-full gap-2">
                <span>Erudite Assistant</span>
                <span className="text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">{user.lexy_prompts_used || 0}/10 Requests</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-muted hover:text-text hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-purple-500 text-white rounded-br-sm' 
                    : 'bg-surfaceHighlight text-text border border-white/5 rounded-bl-sm'
                }`}
              >
                <div className="markdown-body text-sm leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-4 rounded-2xl bg-surfaceHighlight border border-white/5 rounded-bl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-xs text-muted italic">Consulting the archives...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prebuilt Prompts */}
        {!isLoading && (
          <div className="p-3 border-t border-white/5 bg-surface/50 overflow-x-auto no-scrollbar flex gap-2">
            {PREBUILT_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt)}
                className="whitespace-nowrap px-3 py-1.5 bg-surfaceHighlight border border-white/5 rounded-full text-[10px] font-medium text-muted hover:text-purple-500 hover:border-purple-500/30 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-surface rounded-b-2xl relative">
          {/* Token Warning Popup */}
          {showTokenWarning && (
            <div className="absolute bottom-full left-4 right-4 mb-2 p-3 bg-orange-500/10 border border-orange-500/30 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)] text-xs rounded-xl backdrop-blur-md transition-all">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-base leading-none">⚠️</span>
                <p className="flex-1 mt-0.5 text-orange-500">
                  You need <strong>40 Scholar Tokens</strong> to consult Lexy. 
                  Earn tokens by practicing flashcards, playing the matching game, or keeping up your daily streak!
                </p>
                <button 
                  type="button"
                  onClick={() => setShowTokenWarning(false)} 
                  className="p-1 -mr-1 -mt-1 text-orange-500/70 hover:text-orange-500 hover:bg-orange-500/10 rounded-full transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if ((user?.tokens || 0) < 40) {
                setShowTokenWarning(true);
                setTimeout(() => setShowTokenWarning(false), 8000);
                return;
              }
              handleSend(input);
            }}
            className="relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Lexy about a word... (40 Tokens)"
              className="w-full bg-surfaceHighlight border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-muted focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-500 hover:text-purple-500/80 disabled:opacity-50 disabled:hover:text-purple-500 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LexyAssistant;
