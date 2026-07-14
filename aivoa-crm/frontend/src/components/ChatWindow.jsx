import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendMessageStart,
  sendMessageSuccess,
  sendMessageFailure,
  addLocalMessage,
  clearChat,
} from '../store/chatSlice';
import axios from 'axios';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow() {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.chat);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setInputText('');
    dispatch(addLocalMessage(userMessage));
    dispatch(sendMessageStart());

    try {
      // POST the conversation to backend. The backend processes the message via LangGraph
      const response = await axios.post('/api/chat', {
        message: userMessage.text,
        history: messages.map((m) => ({ sender: m.sender, text: m.text })),
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.data.reply,
        timestamp: new Date().toISOString(),
      };

      // The backend might return extracted data once the interaction is finalized
      dispatch(
        sendMessageSuccess({
          message: assistantMessage,
          extractedData: response.data.extracted_data || null,
        })
      );
    } catch (err) {
      console.error(err);
      dispatch(
        sendMessageFailure(
          err.response?.data?.detail || 'Something went wrong while talking to the AI assistant.'
        )
      );
    }
  };

  const handleClear = () => {
    dispatch(clearChat());
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Bot size={18} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              AI Copilot
              <Sparkles size={14} className="text-teal animate-pulse" />
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Natural Language Log Assistant
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClear} color="error" title="Clear Chat">
          <Trash2 size={16} />
        </IconButton>
      </Box>

      {/* Message Area */}
      <CardContent
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 'calc(100vh - 350px)',
          minHeight: '400px',
        }}
      >
        <AnimatePresence>
          {messages.map((message) => {
            const isBot = message.sender === 'assistant';
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexDirection: isBot ? 'row' : 'row-reverse',
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isBot ? 'primary.main' : 'secondary.main',
                    fontSize: '0.8rem',
                  }}
                >
                  {isBot ? <Bot size={16} /> : <User size={16} />}
                </Avatar>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: isBot ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
                      bgcolor: isBot
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(13, 148, 136, 0.1)' : 'rgba(13, 148, 136, 0.05)'
                        : (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.07)',
                      border: '1px solid',
                      borderColor: isBot
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(13, 148, 136, 0.1)'
                        : (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                    }}
                  >
                    <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>
                  </Paper>
                </motion.div>
              </Box>
            );
          })}
        </AnimatePresence>

        {loading && (
          <Box sx={{ display: 'flex', gap: 1.5, alignSelf: 'flex-start', alignItems: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <Bot size={16} />
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: '0px 12px 12px 12px',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(13,148,136,0.05)' : 'rgba(13,148,136,0.02)',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={14} color="primary" />
              <Typography variant="caption" color="text.secondary">AI is analyzing...</Typography>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <Divider />

      {/* Input Form */}
      <Box component="form" onSubmit={handleSend} sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Speak to AI assistant (e.g. 'I met Dr Thomas today...')"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          autoComplete="off"
        />
        <IconButton type="submit" color="primary" disabled={!inputText.trim() || loading} sx={{ bgcolor: 'primary.main', color: '#ffffff', '&:hover': { bgcolor: 'primary.dark' }, width: 40, height: 40 }}>
          <Send size={16} />
        </IconButton>
      </Box>
    </Card>
  );
}
