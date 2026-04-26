import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User } from '../types';
import { api } from '../service';

interface Message {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
}

interface ChatPanelProps {
    currentUser: User;
    otherUser: User | null;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser, otherUser, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000', { withCredentials: true });
        setSocket(newSocket);

        newSocket.emit('join', currentUser.id);

        newSocket.on('message', (msg: Message) => {
            if (msg.senderId === otherUser?.id) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [currentUser.id, otherUser?.id]);

    useEffect(() => {
        if (otherUser) {
            api.get(`/messages/${otherUser.id}`).then(setMessages);
        }
    }, [otherUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !otherUser) return;

        try {
            const res = await api.post('/messages', {
                receiverId: otherUser.id,
                content: newMessage
            });
            const sentMsg: Message = {
                id: res.id,
                senderId: currentUser.id,
                content: newMessage,
                createdAt: res.createdAt
            };
            setMessages(prev => [...prev, sentMsg]);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    if (!otherUser) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[100] animate-fade-in-up">
            {/* Header */}
            <div className="p-4 border-b bg-indigo-600 text-white rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        {otherUser.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-sm">{otherUser.name}</p>
                        <p className="text-xs opacity-80">{otherUser.role}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                            {msg.content}
                            <p className={`text-[10px] mt-1 opacity-60 ${msg.senderId === currentUser.id ? 'text-white' : 'text-gray-500'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-2xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;
