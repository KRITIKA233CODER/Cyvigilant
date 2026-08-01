const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let aiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    aiModel = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: 'You are a professional and helpful customer support assistant for Vigilant Technologies. Keep answers concise, clear, and polite. Always address the user by name when appropriate.'
    });
    console.log('Gemini AI successfully initialized.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI SDK:', err.message);
  }
} else {
  console.warn('GEMINI_API_KEY not found in env. Running in Fallback Mock Mode.');
}

const getMockResponse = (userMessage, username) => {
  const msg = userMessage.toLowerCase();
  let text = `Hello ${username}, thank you for contacting Vigilant Technologies Support. (Running in Demo/Mock Mode: GEMINI_API_KEY is not configured).`;

  if (msg.includes('hello') || msg.includes('hi')) {
    text = `Hello ${username}! How can I help you today with Vigilant Technologies' services?`;
  } else if (msg.includes('order') || msg.includes('buy') || msg.includes('purchase')) {
    text = `Sure, ${username}. I can help you track or manage your order. Please provide your order ID, or tell me what item you'd like to purchase!`;
  } else if (msg.includes('refund') || msg.includes('cancel') || msg.includes('return')) {
    text = `We offer a 30-day return policy. If you would like to initiate a refund or cancel an order, let me know your order details and we can proceed.`;
  } else if (msg.includes('password') || msg.includes('login') || msg.includes('account')) {
    text = `To reset your password, please go to the Login screen, click "Forgot Password", and follow the link sent to your registered email.`;
  } else {
    text = `Thank you for your question, ${username}! Our customer support team will review this message. You said: "${userMessage}". Let me know if there's anything else you'd like to ask.`;
  }
  return text;
};

router.post('/chat', async (req, res) => {
  const { username, message, conversationId } = req.body;

  if (!username || typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  try {
    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation session not found' });
      }
    } else {
      conversation = new Conversation({
        username: username.trim(),
        messages: []
      });
    }

    const contents = [];
    conversation.messages.forEach(msg => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    let aiReply = '';

    if (aiModel) {
      try {
        const result = await aiModel.generateContent({ contents });
        aiReply = result.response.text();
      } catch (err) {
        console.error('Gemini API Error:', err.message);
        aiReply = `[System Notification: AI service temporarily unavailable. Fallback response active.]\nHello ${username}, I received your message: "${message}". How can I help you resolve this issue today?`;
      }
    } else {
      aiReply = getMockResponse(message.trim(), username.trim());
    }

    conversation.messages.push({ sender: 'user', text: message.trim() });
    conversation.messages.push({ sender: 'ai', text: aiReply.trim() });

    await conversation.save();

    res.json({
      success: true,
      conversationId: conversation._id,
      reply: aiReply.trim(),
      messages: conversation.messages
    });

  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

router.get('/chat/history', async (req, res) => {
  try {
    const { username } = req.query;
    const filter = username 
      ? { username: new RegExp(`^${username.trim()}$`, 'i') } 
      : {};

    const conversations = await Conversation.find(filter)
      .sort({ createdAt: -1 })
      .select({
        username: 1,
        createdAt: 1,
        messages: { $slice: -1 }
      });

    const list = conversations.map(convo => {
      const lastMsg = convo.messages && convo.messages.length > 0 ? convo.messages[0].text : '';
      return {
        _id: convo._id,
        username: convo.username,
        lastMessage: lastMsg,
        createdAt: convo.createdAt
      };
    });

    res.json(list);
  } catch (error) {
    console.error('Error fetching chat lists:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

router.get('/chat/history/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation history not found' });
    }
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

router.delete('/chat/history/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation history not found' });
    }
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
