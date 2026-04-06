import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.PROD ? "/api" : "http://localhost:8000";

const Chatbot = ({ systemState }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Welcome to GMIS Clinical Intelligence. I am powered by Clinical BERT and trained on the latest swarm gradients. How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg = { role: 'doctor', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch(`${API_BASE}/chatbot/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: input })
            });
            const data = await response.json();
            
            setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to the clinical knowledge swarm. Please check your network connection." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
            {/* Header */}
            <div className="p-6 border-b border-slate-200/50 bg-white/60 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-medical-500 to-medical-700 flex items-center justify-center text-white shadow-lg shadow-medical-500/30">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-display font-bold text-slate-900 tracking-tight">Clinical Assistant</h2>
                        <div className="flex items-center gap-2">
                             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Clinical BERT v3.14</span>
                        </div>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100">
                    <Sparkles className="text-amber-500" size={14} />
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Gradient Informed</span>
                </div>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scroll-smooth"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'doctor' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'doctor' ? 'bg-slate-800 text-white' : 'bg-medical-100 text-medical-600'}`}>
                                    {msg.role === 'doctor' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={`relative px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                    msg.role === 'doctor' 
                                    ? 'bg-medical-600 text-white rounded-tr-none border border-medical-500' 
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                }`}>
                                    {msg.text}
                                    <span className="absolute bottom-[-18px] text-[9px] text-slate-400 font-medium uppercase tracking-tight">
                                        {msg.role === 'doctor' ? 'Doctor' : 'GMIS AI'} · {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-medical-100 text-medical-600 flex items-center justify-center">
                                    <Bot size={14} />
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-medical-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-medical-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-medical-300 rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest ml-2">Analyzing Gradients...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Insight Banner */}
            <div className="px-6 py-3 bg-medical-50/50 border-y border-medical-100/50 flex items-center gap-3">
                <Info size={14} className="text-medical-600" />
                <p className="text-[10px] text-medical-700 font-semibold tracking-wide uppercase italic">
                    Note: Clinical BERT is summarizing the swarm's current model updates for this round.
                </p>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/60 backdrop-blur-md">
                <form 
                    onSubmit={handleSend}
                    className="relative group"
                >
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the swarm about local hospital drift or model accuracy..."
                        disabled={isTyping}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-6 pr-16 py-4 text-sm font-medium focus:outline-none focus:border-medical-500/50 focus:ring-4 focus:ring-medical-500/5 transition-all placeholder:text-slate-400"
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-medical-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-medical-600/20 hover:bg-medical-700 hover:-translate-y-1/2 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </button>
                </form>
                <div className="flex items-center justify-between mt-4 px-2">
                    <p className="text-[10px] text-slate-400 font-medium">Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Enter</kbd> to transmit to swarm</p>
                    <div className="flex gap-4">
                        <button type="button" className="text-[10px] text-medical-600 font-bold uppercase tracking-widest hover:underline" onClick={() => setInput("What's the status of the global model accuracy?")}>Status Report</button>
                        <button type="button" className="text-[10px] text-medical-600 font-bold uppercase tracking-widest hover:underline" onClick={() => setInput("Which node is experiencing the most drift?")}>Drift Summary</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
