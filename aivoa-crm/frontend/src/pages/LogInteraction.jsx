import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import InteractionForm from '../components/InteractionForm';
import ChatWindow from '../components/ChatWindow';

export default function LogInteraction() {
  return (
    <Box sx={{ height: '100%' }}>
      {/* Title Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          Log Doctor Interaction
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter meeting details manually in the form or speak with the AI assistant to automatically extract and populate details.
        </Typography>
      </Box>

      {/* Grid Container split screen */}
      <Grid container spacing={4} alignItems="stretch" sx={{ height: 'calc(100% - 80px)' }}>
        {/* Left Hand: Form */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <InteractionForm />
        </Grid>

        {/* Right Hand: AI Chat Assistant */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <ChatWindow />
        </Grid>
      </Grid>
    </Box>
  );
}
