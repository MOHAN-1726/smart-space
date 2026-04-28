import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { User } from "../types";
import { api } from "../service";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

interface ChatProps {
  user: User;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all users
    api.get("/users").then((data) => {
      setUsers(data.filter((u: User) => u.id !== user.id));
    });

    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("receiveMessage", (msg: Message) => {
      if (msg.receiverId === user.id || msg.senderId === user.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user.id]);

  useEffect(() => {
    if (selectedUser) {
      api.get(`/messages/history/${selectedUser.id}`).then((data) => {
        setMessages(data);
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    const msgData = {
      receiverId: selectedUser.id,
      message,
    };

    try {
      const res = await api.post("/messages/send", msgData);
      
      if (socket) {
        socket.emit("sendMessage", {
          ...res,
          senderId: user.id,
          receiverId: selectedUser.id
        });
      }
      
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages.filter(
    (m) =>
      selectedUser &&
      ((m.senderId === user.id && m.receiverId === selectedUser.id) ||
        (m.senderId === selectedUser.id && m.receiverId === user.id))
  );

  const uniqueMessages = Array.from(new Map(filteredMessages.map(item => [item.id, item])).values());

  return (
    <div className="max-w-6xl mx-auto flex h-[80vh] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-6">
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Chat Contacts</h2>
            <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 font-medium">Back</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-100 flex items-center gap-3 ${
                selectedUser?.id === u.id ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                {u.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-500">{u.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">{selectedUser.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
              {uniqueMessages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex ${
                    msg.senderId === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.senderId === user.id
                        ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p>Select a user to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
