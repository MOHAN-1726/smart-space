import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { User, Role } from '../types';
import { Card, Button } from './UI';
import { SpinnerIcon, SparklesIcon, GraduationCapIcon, KeyIcon, EyeIcon, DocumentTextIcon, LightBulbIcon } from './Icons';

// Initialize the AI client once, securely using the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// A styled container for each AI tool
const AIToolCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <div className={`bg-white dark:bg-zinc-900/60 dark:backdrop-blur-lg rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
        <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-teal-400 bg-clip-text text-transparent">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    </div>
);

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
        <input 
            id={id}
            {...props}
            className="mt-1 block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:shadow-glow focus:border-primary-500 transition"
        />
    </div>
);

const StyledTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
        <textarea
            id={id}
            {...props}
            className="mt-1 block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:shadow-glow focus:border-primary-500 transition min-h-[120px]"
        />
    </div>
);

// Sub-component for the Lesson Plan Generator tool
const LessonPlanGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic || !gradeLevel || !duration) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        setResult('');
        setError('');
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate a detailed lesson plan for a ${gradeLevel} class on the topic of "${topic}" for a duration of ${duration} minutes. The plan must be in Markdown format and include these sections:\n- **Learning Objectives**\n- **Materials Needed**\n- **Lesson Activities (with timeline)**\n- **Assessment**\n- **Differentiation** (for support and extension)`,
                config: {
                    systemInstruction: "You are an expert curriculum developer who creates engaging and structured lesson plans.",
                },
            });

            setResult(response.text);
        } catch (e) {
            console.error("Error generating lesson plan:", e); // Detailed error log
            setError('Failed to generate the lesson plan. The AI service may be unavailable or experiencing issues. Please try again later.'); // User-friendly message
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (error) setError('');
    };

    return (
        <AIToolCard title="Lesson Plan Generator" icon={<GraduationCapIcon />} className="animate-slideInUp">
            <div className="space-y-4">
                <StyledInput id="topic" label="Topic" value={topic} onChange={handleInputChange(setTopic)} placeholder="e.g., Photosynthesis" disabled={loading} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StyledInput id="gradeLevel" label="Grade Level / Year" value={gradeLevel} onChange={handleInputChange(setGradeLevel)} placeholder="e.g., 10th Grade" disabled={loading} />
                    <StyledInput id="duration" label="Duration (minutes)" type="number" value={duration} onChange={handleInputChange(setDuration)} placeholder="e.g., 45" disabled={loading} />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="text-right pt-2">
                    <Button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 justify-center min-w-[140px]">
                        {loading ? <><SpinnerIcon /> Generating...</> : 'Generate Plan'}
                    </Button>
                </div>
                {result && (
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-fadeIn">
                        <h4 className="font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Generated Lesson Plan:</h4>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">{result}</pre>
                    </div>
                )}
            </div>
        </AIToolCard>
    );
};

// Sub-component for the Study Guide Generator tool
const StudyGuideGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [keyConcepts, setKeyConcepts] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic) {
            setError('Please provide a topic.');
            return;
        }
        setLoading(true);
        setResult('');
        setError('');
        try {
            let prompt = `Create a concise study guide for the topic "${topic}". The guide should include key definitions, important formulas or concepts, and a few practice questions with answers to test understanding.`;
            if (keyConcepts) {
                prompt += ` Please focus especially on these key concepts: ${keyConcepts}.`;
            }
            prompt += ' Format the output clearly with headings for each section.';
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setResult(response.text);
        } catch (e) {
            console.error("Error generating study guide:", e); // Detailed error log
            setError('Failed to generate the study guide. The AI service may be unavailable or experiencing issues. Please try again later.'); // User-friendly message
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (error) setError('');
    };
    
    return (
        <AIToolCard title="Study Guide Generator" icon={<KeyIcon />} className="animate-slideInUp">
            <div className="space-y-4">
                <StyledInput id="study-topic" label="Subject / Topic" value={topic} onChange={handleInputChange(setTopic)} placeholder="e.g., Linear Algebra" />
                <StyledInput id="key-concepts" label="Focus Areas / Key Concepts (optional)" value={keyConcepts} onChange={handleInputChange(setKeyConcepts)} placeholder="e.g., vectors, matrices, eigenvalues" />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="text-right pt-2">
                    <Button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 justify-center min-w-[140px]">
                        {loading ? <><SpinnerIcon /> Generating...</> : 'Generate Guide'}
                    </Button>
                </div>
                {result && (
                     <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-fadeIn">
                        <h4 className="font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Generated Study Guide:</h4>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">{result}</pre>
                    </div>
                )}
            </div>
        </AIToolCard>
    );
};

interface Quiz {
    title: string;
    questions: {
        question: string;
        options?: string[]; // Multiple Choice
        answer?: boolean; // True/False
        correctAnswer: string | boolean; // Short Answer, MC, or T/F
        type: 'multiple_choice' | 'true_false' | 'short_answer';
    }[];
}

const QuizGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [numQuestions, setNumQuestions] = useState('5');
    const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Quiz | null>(null);
    const [error, setError] = useState('');
    const [showAnswers, setShowAnswers] = useState(false);

    const handleGenerate = async () => {
        if (!topic || !gradeLevel || !numQuestions) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        setResult(null);
        setError('');

        const prompt = `Generate a quiz with ${numQuestions} ${questionType.replace('_', ' ')} questions for a ${gradeLevel} class on the topic: "${topic}".`;
        
        const schema = {
             type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                type: { type: Type.STRING },
                                ...(questionType === 'multiple_choice' && {
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.STRING }
                                }),
                                ...(questionType === 'true_false' && {
                                    correctAnswer: { type: Type.BOOLEAN }
                                }),
                                ...(questionType === 'short_answer' && {
                                    correctAnswer: { type: Type.STRING }
                                }),
                            },
                             required: ['question', 'type', 'correctAnswer']
                        },
                    },
                },
                required: ['title', 'questions'],
        };

        let responseText = '';
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            });
            responseText = response.text;
            const json = JSON.parse(responseText);
            setResult(json);
            setShowAnswers(false);

        } catch (e) {
            console.error("Error generating quiz:", e); // Detailed error log for any failure
            if (e instanceof SyntaxError) {
                // This specifically catches JSON.parse failures
                console.error("Failed to parse AI response as JSON:", responseText); // Log the invalid response
                setError("The AI returned a response in an unexpected format. Please try adjusting your request or try again.");
            } else {
                // This catches API errors or other issues
                setError("Failed to generate the quiz. The AI service may be unavailable or experiencing issues. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setter(e.target.value);
        if (error) setError('');
    };

    return (
         <AIToolCard title="Quiz Generator" icon={<SparklesIcon />} className="animate-slideInUp">
            <div className="space-y-4">
                <StyledInput id="quiz-topic" label="Topic" value={topic} onChange={handleInputChange(setTopic)} placeholder="e.g., The Solar System" disabled={loading} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StyledInput id="quiz-grade" label="Grade Level / Year" value={gradeLevel} onChange={handleInputChange(setGradeLevel)} placeholder="e.g., 5th Grade" disabled={loading} />
                    <StyledInput id="quiz-questions" label="Number of Questions" type="number" value={numQuestions} onChange={handleInputChange(setNumQuestions)} placeholder="e.g., 5" disabled={loading} />
                    <div>
                        <label htmlFor="question-type" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Question Type</label>
                        <select id="question-type" value={questionType} onChange={handleInputChange(setQuestionType as any)} className="mt-1 block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:shadow-glow focus:border-primary-500 transition">
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                        </select>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="text-right pt-2">
                    <Button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 justify-center min-w-[140px]">
                        {loading ? <><SpinnerIcon /> Generating...</> : 'Generate Quiz'}
                    </Button>
                </div>

                {result && (
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{result.title}</h4>
                            <Button variant="secondary" onClick={() => setShowAnswers(s => !s)} className="flex items-center gap-2">
                                <EyeIcon className="w-4 h-4" /> {showAnswers ? 'Hide' : 'Show'} Answers
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {result.questions.map((q, index) => (
                                <div key={index}>
                                    <p className="font-semibold mb-2">{index + 1}. {q.question}</p>
                                    {q.type === 'multiple_choice' && q.options && (
                                        <ul className="space-y-2 pl-4">
                                            {q.options.map((option, optIndex) => {
                                                const isCorrect = option === q.correctAnswer;
                                                return (
                                                    <li key={optIndex} className={`p-2 rounded-md transition-colors ${
                                                        showAnswers ? (isCorrect ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300') : 'bg-white dark:bg-zinc-800'
                                                    }`}>
                                                        {String.fromCharCode(65 + optIndex)}. {option}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                    {q.type === 'true_false' && (
                                        <div className="pl-4">
                                            {showAnswers ? (
                                                <p className={`p-2 rounded-md font-semibold ${q.correctAnswer ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                                                    Correct Answer: {String(q.correctAnswer)}
                                                </p>
                                            ) : (
                                                <div className="flex gap-4">
                                                    <span className="p-2 rounded-md bg-white dark:bg-zinc-800">True</span>
                                                    <span className="p-2 rounded-md bg-white dark:bg-zinc-800">False</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {q.type === 'short_answer' && (
                                         <div className="pl-4">
                                            {showAnswers ? (
                                                <p className="p-2 rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                                                    <strong>Answer:</strong> {String(q.correctAnswer)}
                                                </p>
                                            ) : (
                                                 <input type="text" placeholder="Type your answer..." className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AIToolCard>
    );
};

const TextSummarizer: React.FC = () => {
    const [text, setText] = useState('');
    const [mainTopic, setMainTopic] = useState('');
    const [summaryLength, setSummaryLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text to summarize.');
            return;
        }
        setLoading(true);
        setResult('');
        setError('');

        const lengthInstructionMap = {
            'Short': 'as a brief summary of a few sentences',
            'Medium': 'as a single, detailed paragraph',
            'Long': 'as a comprehensive, multi-paragraph summary'
        };
        const lengthInstruction = lengthInstructionMap[summaryLength];

        try {
            let prompt = `Summarize the following text ${lengthInstruction}`;
            if (mainTopic.trim()) {
                prompt += ` with a focus on "${mainTopic.trim()}"`;
            }
            prompt += `:\n\n${text}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating summary:", e); // Detailed error log
            setError('Failed to generate the summary. The AI service may be unavailable or experiencing issues. Please try again later.'); // User-friendly message
        } finally {
            setLoading(false);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (error) {
            setError('');
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMainTopic(e.target.value);
        if (error) {
            setError('');
        }
    };

    return (
        <AIToolCard title="Text Summarizer" icon={<DocumentTextIcon />} className="animate-slideInUp">
            <div className="space-y-4">
                <StyledTextarea
                    id="text-summarizer"
                    label="Text to Summarize"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Paste your text here..."
                    disabled={loading}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StyledInput 
                        id="summary-topic" 
                        label="Main Topic (optional)" 
                        value={mainTopic} 
                        onChange={handleInputChange} 
                        placeholder="e.g., The impact on climate change" 
                        disabled={loading} 
                    />
                    <div>
                        <label htmlFor="summary-length" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Summary Length</label>
                        <select 
                            id="summary-length" 
                            value={summaryLength} 
                            onChange={(e) => setSummaryLength(e.target.value as 'Short' | 'Medium' | 'Long')}
                            disabled={loading}
                            className="mt-1 block w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:shadow-glow focus:border-primary-500 transition"
                        >
                            <option value="Short">Short</option>
                            <option value="Medium">Medium</option>
                            <option value="Long">Long</option>
                        </select>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="text-right pt-2">
                    <Button onClick={handleGenerate} disabled={loading || !text.trim()} className="flex items-center gap-2 justify-center min-w-[140px]">
                        {loading ? <><SpinnerIcon /> Summarizing...</> : 'Generate Summary'}
                    </Button>
                </div>
                {result && (
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-fadeIn">
                        <h4 className="font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Generated Summary:</h4>
                        <p className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">{result}</p>
                    </div>
                )}
            </div>
        </AIToolCard>
    );
};

const ConceptExplainer: React.FC = () => {
    const [concept, setConcept] = useState('');
    const [audience, setAudience] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!concept.trim()) {
            setError('Please enter a concept to explain.');
            return;
        }
        setLoading(true);
        setResult('');
        setError('');
        try {
            let prompt = `Explain the concept of "${concept.trim()}" in a clear and concise way`;
            if (audience.trim()) {
                prompt += ` as if you were explaining it to ${audience.trim()}.`;
            } else {
                prompt += ` for a general audience.`;
            }
             prompt += ` Use analogies if they are helpful.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e) {
            console.error("Error generating explanation:", e); // Detailed error log
            setError('Failed to generate the explanation. The AI service may be unavailable or experiencing issues. Please try again later.'); // User-friendly message
        } finally {
            setLoading(false);
        }
    };
    
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (error) setError('');
    };

    return (
        <AIToolCard title="Concept Explainer" icon={<LightBulbIcon />} className="animate-slideInUp">
            <div className="space-y-4">
                <StyledInput 
                    id="concept-explainer" 
                    label="Term or Concept" 
                    value={concept} 
                    onChange={handleInputChange(setConcept)}
                    placeholder="e.g., Quantum Computing" 
                    disabled={loading} 
                />
                <StyledInput 
                    id="concept-audience" 
                    label="Target Audience (optional)" 
                    value={audience} 
                    onChange={handleInputChange(setAudience)}
                    placeholder="e.g., a 5th grader, a university student" 
                    disabled={loading} 
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="text-right pt-2">
                    <Button onClick={handleGenerate} disabled={loading || !concept.trim()} className="flex items-center gap-2 justify-center min-w-[140px]">
                        {loading ? <><SpinnerIcon /> Explaining...</> : 'Generate Explanation'}
                    </Button>
                </div>
                {result && (
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-fadeIn">
                        <h4 className="font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Explanation:</h4>
                        <p className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300">{result}</p>
                    </div>
                )}
            </div>
        </AIToolCard>
    );
};

interface AIToolsProps {
  user: User;
}

const AITools: React.FC<AIToolsProps> = ({ user }) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="w-10 h-10 text-primary-500" />
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-teal-400 bg-clip-text text-transparent">
          AI Assistant Tools
        </h2>
      </div>
      <p className="mb-10 text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Leverage the power of AI to streamline your tasks. Select a tool below to get started.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {user.role === Role.STAFF && (
          <>
            <LessonPlanGenerator />
            <QuizGenerator />
          </>
        )}
        {user.role === Role.STUDENT && <StudyGuideGenerator />}
        <TextSummarizer />
        <ConceptExplainer />
      </div>
    </div>
  );
};

export default AITools;
