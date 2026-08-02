import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, 
  MessageSquare, 
  Plus, 
  Trash2, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Key,
  CreditCard,
  Package
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';


const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      className={`copy-msg-btn ${copied ? 'copied' : ''}`} 
      onClick={handleCopy} 
      title="Copy response text"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};


const parseBold = (text) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    
    if (index % 2 === 1) {
      return <strong key={index} className="accent-bold">{part}</strong>;
    }
    return part;
  });
};


const renderMessageText = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  let inList = false;
  const listItems = [];
  const elements = [];
  
  lines.forEach((line, index) => {
    const bulletMatch = line.match(/^[\*\-\u2022]\s+(.*)/);
    
    if (bulletMatch) {
      if (!inList) {
        inList = true;
      }
      listItems.push(bulletMatch[1]);
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="msg-list">
            {listItems.map((item, idx) => (
              <li key={idx}>{parseBold(item)}</li>
            ))}
          </ul>
        );
        listItems.length = 0;
        inList = false;
      }
      
      if (line.trim() === '') {
        elements.push(<div key={`spacer-${index}`} className="msg-spacer" />);
      } else {
        elements.push(<p key={`p-${index}`}>{parseBold(line)}</p>);
      }
    }
  });
  
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="list-final" className="msg-list">
        {listItems.map((item, idx) => (
          <li key={idx}>{parseBold(item)}</li>
        ))}
      </ul>
    );
  }
  
  return <div className="formatted-message">{elements}</div>;
};

function App() {
  
  const [username, setUsername] = useState(() => localStorage.getItem('chat_username') || '');
  const [inputName, setInputName] = useState('');

  
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const [systemStatus, setSystemStatus] = useState('checking');
  const [latency, setLatency] = useState(null);

  
  useEffect(() => {
    const checkStatus = async () => {
      const start = Date.now();
      try {
        await axios.get(`${API_BASE}/chat/history?username=probe-status-check`);
        setSystemStatus('connected');
        setLatency(Date.now() - start);
      } catch (err) {
        setSystemStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      // Fallback to guarantee scroll after DOM rendering layout calculations
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  
  useEffect(() => {
    window.scrollTo(0, 0);
    const initLoad = async () => {
      const storedName = localStorage.getItem('chat_username');
      if (storedName) {
        try {
          const response = await axios.get(`${API_BASE}/chat/history?username=${encodeURIComponent(storedName)}`);
          setConversations(response.data);
          
          setActiveConversationId(null);
          setMessages([]);
        } catch (err) {
          console.error('Initial chat load failed:', err);
        }
      }
    };
    initLoad();
  }, []);

  
  const fetchHistory = async () => {
    if (!username) return;
    try {
      const response = await axios.get(`${API_BASE}/chat/history?username=${encodeURIComponent(username)}`);
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  
  useEffect(() => {
    if (username) {
      fetchHistory();
    }
  }, [username]);

  
  const handleSelectConversation = async (id) => {
    setErrorMessage('');
    setActiveConversationId(id);
    setSidebarOpen(false);
    try {
      const response = await axios.get(`${API_BASE}/chat/history/${id}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch conversation details:', err);
      setErrorMessage('Could not load chat messages. Please try again.');
    }
  };

  
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setErrorMessage('');
    setSidebarOpen(false);
  };

  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (inputName.trim()) {
      const formattedName = inputName.trim();
      setUsername(formattedName);
      localStorage.setItem('chat_username', formattedName);
      
      
      try {
        const response = await axios.get(`${API_BASE}/chat/history?username=${encodeURIComponent(formattedName)}`);
        setConversations(response.data);
        setActiveConversationId(null);
        setMessages([]);
      } catch (err) {
        console.error('Login chat retrieve failed:', err);
      }
    }
  };

  
  const handleLogout = () => {
    setUsername('');
    setInputName('');
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    localStorage.removeItem('chat_username');
  };

  
  const sendMessageText = async (messageText) => {
    if (!messageText.trim() || loading) return;

    setErrorMessage('');

    
    const tempUserMessage = { sender: 'user', text: messageText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      const payload = {
        username,
        message: messageText,
        conversationId: activeConversationId
      };
      
      const response = await axios.post(`${API_BASE}/chat`, payload);
      
      if (response.data.success) {
        
        if (!activeConversationId) {
          setActiveConversationId(response.data.conversationId);
        }
        setMessages(response.data.messages);
        fetchHistory(); 
      } else {
        setErrorMessage(response.data.error || 'Failed to get a response.');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setErrorMessage(
        err.response?.data?.error || 
        'Unable to connect to the backend server. Make sure it is running on port 5000.'
      );
      
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessageText(inputValue.trim());
      setInputValue('');
    }
  };

  
  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation(); 
    setErrorMessage('');
    try {
      await axios.delete(`${API_BASE}/chat/history/${id}`);
      fetchHistory();
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
      setErrorMessage('Failed to delete conversation history.');
    }
  };

  
  if (!username) {
    return (
      <div className="landing-page">
        {}
        <nav className="landing-nav">
          <div className="nav-logo">
            <Sparkles size={22} className="logo-sparkle" />
            <span>Vigilant Hub</span>
          </div>
          <div className="nav-status">
            <span className="status-dot connected"></span>
            <span>Network Online</span>
          </div>
        </nav>

        {}
        <div className="landing-content">
          <div className="landing-hero-section">
            <div className="hero-badge">Next-Gen Support Assistant</div>
            <h1 className="hero-title">
              Intelligent Support <br />
              <span className="gradient-text">Redefined for Speed.</span>
            </h1>
            <p className="hero-subtitle">
              Solve password locks, check return parameters, search in-transit cargo status, and receive real-time technical answers from our Gemini AI agent in seconds.
            </p>

            {}
            <div className="landing-features">
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Google Gemini 3.5 Flash Integration</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Mongoose Database Log Session Memory</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Responsive Drawer Layout support for all screens</span>
              </div>
            </div>
          </div>

          {}
          <div className="landing-login-section">
            <div className="welcome-card landing-card">
              <div className="card-header">
                <h3>Access Support Console</h3>
                <p>Enter your client name to login or start a new support session</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="input-group">
                <div className="styled-input-wrapper">
                  <User size={18} className="input-user-icon" />
                  <input
                    type="text"
                    placeholder="Enter your name..."
                    className="styled-input"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    required
                    maxLength={30}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary landing-btn">
                  Launch Assistant <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {}
        <footer className="landing-footer">
          <span>&copy; 2026 Vigilant Technologies. Built with React, Node.js, and MongoDB.</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container">
      {}
      <header className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h3>Vigilant Support</h3>
      </header>

      {}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
      )}

      {}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="header-actions">
            {!sidebarCollapsed ? (
              <button className="new-chat-btn" onClick={handleNewChat}>
                <Plus size={16} /> New Chat Session
              </button>
            ) : (
              <button className="new-chat-btn collapsed-btn" onClick={handleNewChat} title="New Chat Session">
                <Plus size={16} />
              </button>
            )}
            <button 
              className="collapse-toggle-btn" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        <div className="history-section">
          {!sidebarCollapsed && <div className="history-title">Recent Chats</div>}
          {conversations.length === 0 ? (
            !sidebarCollapsed && (
              <div style={{ padding: '0 8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                No previous chats found.
              </div>
            )
          ) : (
            conversations.map((convo) => (
              <div
                key={convo._id}
                className={`history-item ${activeConversationId === convo._id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(convo._id)}
                title={sidebarCollapsed ? `${convo.username}: ${convo.lastMessage}` : ''}
              >
                <div className="history-info">
                  <MessageSquare size={16} className="history-icon" />
                  {!sidebarCollapsed && (
                    <div className="history-meta">
                      <span className="history-username">{convo.username}</span>
                      <span className="history-preview">{convo.lastMessage || 'Empty chat'}</span>
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <button
                    className="delete-history-btn"
                    onClick={(e) => handleDeleteConversation(convo._id, e)}
                    title="Delete Conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {username.charAt(0).toUpperCase()}
              <div className="avatar-status-badge"></div>
            </div>
            {!sidebarCollapsed && <span className="user-name" title={username}>{username}</span>}
          </div>
          {!sidebarCollapsed && (
            <button className="exit-btn" onClick={handleLogout} title="Change Username / Exit">
              <LogOut size={16} />
            </button>
          )}

          {}
          {!sidebarCollapsed && (
            <div className="profile-card-popup">
              <div className="profile-card-popup-header">
                <div className="profile-avatar large">
                  {username.charAt(0).toUpperCase()}
                  <div className="avatar-status-badge"></div>
                </div>
                <div className="profile-details">
                  <div className="profile-name" title={username}>{username}</div>
                  <div className="profile-role">Guest Client</div>
                </div>
              </div>
              <div className="profile-card-popup-footer">
                <button className="profile-action-btn" onClick={handleLogout} title="Sign Out">
                  <LogOut size={13} /> <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {}
          {sidebarCollapsed && (
            <div className="profile-card-collapsed-click" onClick={handleLogout} title={`Signed in as ${username}. Click to Sign Out.`}>
              {}
            </div>
          )}
        </div>
      </aside>

      {}
      <main className="chat-main">
        {}
        <header className="chat-header">
          <div className="chat-title-info">
            <div className={`chat-status-indicator ${systemStatus === 'connected' ? 'online' : 'offline'}`}></div>
            <div>
              <h2 className="chat-title">Customer Support Assistant</h2>
              <p className="chat-subtitle">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="status-monitor-badge" title="Database & API connection latency monitor">
            <div className={`status-dot ${systemStatus}`}></div>
            <span className="status-text">
              {systemStatus === 'connected' ? `Connected ${latency ? `• ${latency}ms` : ''}` : 'Server Offline'}
            </span>
          </div>
        </header>

        {}
        <div ref={messagesContainerRef} className="messages-container">
          {errorMessage && (
            <div className="error-banner">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                {errorMessage}
              </span>
              <button className="error-close-btn" onClick={() => setErrorMessage('')}>×</button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-chat-welcome">
                <Sparkles size={48} className="empty-chat-icon" />
                <h2>Hello, {username}!</h2>
                <p>Welcome to Vigilant Customer Support. Please select a common quick action below to initiate assistance, or type a custom query.</p>
              </div>
              
              <div className="quick-prompts-grid">
                <div className="quick-prompt-card" onClick={() => sendMessageText("How do I reset my password?")}>
                  <div className="prompt-card-icon-container">
                    <Key size={20} className="prompt-card-icon" />
                  </div>
                  <div className="prompt-card-details">
                    <h4>Password Recovery</h4>
                    <p>Get helper steps to unlock accounts</p>
                  </div>
                </div>

                <div className="quick-prompt-card" onClick={() => sendMessageText("What is your refund policy?")}>
                  <div className="prompt-card-icon-container">
                    <CreditCard size={20} className="prompt-card-icon" />
                  </div>
                  <div className="prompt-card-details">
                    <h4>Refund & Return Policy</h4>
                    <p>Timelines, refunds, and credentials</p>
                  </div>
                </div>

                <div className="quick-prompt-card" onClick={() => sendMessageText("How can I track my order?")}>
                  <div className="prompt-card-icon-container">
                    <Package size={20} className="prompt-card-icon" />
                  </div>
                  <div className="prompt-card-details">
                    <h4>Order & Shipment Tracking</h4>
                    <p>Locate status on in-transit parcels</p>
                  </div>
                </div>

                <div className="quick-prompt-card" onClick={() => sendMessageText("Can you explain what services Vigilant Technologies provides?")}>
                  <div className="prompt-card-icon-container">
                    <Sparkles size={18} className="prompt-card-icon" />
                  </div>
                  <div className="prompt-card-details">
                    <h4>Vigilant FAQ Services</h4>
                    <p>Overview of technical capabilities</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.sender}`}>
                <div className="message-bubble">
                  {renderMessageText(msg.text)}
                  <div className="message-bubble-footer">
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.sender === 'ai' && <CopyButton text={msg.text} />}
                  </div>
                </div>
              </div>
            ))
          )}

          {}
          {loading && (
            <div className="message-row ai">
              <div className="message-bubble" style={{ padding: '8px 12px' }}>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        <footer className="chat-footer">
          <form onSubmit={handleSendMessage} className="input-container">
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="send-btn" 
              disabled={!inputValue.trim() || loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default App;
