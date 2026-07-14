import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  setWeeklySummary,
  setTodayFollowUps,
} from '../store/interactionSlice';
import axios from 'axios';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Skeleton,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Calendar,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

// Motion configuration
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { interactions, weeklySummary, todayFollowUps, loading, error } = useSelector(
    (state) => state.interactions
  );
  const [refreshing, setRefreshing] = useState(false);
  const [openAllDialog, setOpenAllDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInteractions = interactions.filter((item) => {
    const doc = (item.doctor?.doctor_name || item.doctor_name || '').toLowerCase();
    const hosp = (item.doctor?.hospital || item.hospital || '').toLowerCase();
    const prods = (item.products || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    const summary = (item.summary || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return doc.includes(search) || hosp.includes(search) || prods.includes(search) || notes.includes(search) || summary.includes(search);
  });

  const loadDashboardData = async () => {
    dispatch(fetchStart());
    try {
      // 1. Fetch Interactions
      const resInteractions = await axios.get('/api/interaction');
      dispatch(fetchSuccess(resInteractions.data));

      // 2. Fetch Follow-ups
      const resFollowUps = await axios.get('/api/followups');
      dispatch(setTodayFollowUps(resFollowUps.data));

      // 3. Fetch Weekly Summary
      try {
        const resSummary = await axios.get('/api/summary');
        dispatch(setWeeklySummary(resSummary.data.summary));
      } catch (sumErr) {
        console.warn('Failed to load weekly summary', sumErr);
        dispatch(setWeeklySummary('No weekly summary available. Log interactions to generate AI summaries.'));
      }
    } catch (err) {
      console.error(err);
      dispatch(fetchFailure(err.response?.data?.detail || 'Failed to load dashboard data.'));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Calculations for dashboard
  const today = new Date().toISOString().split('T')[0];
  const meetingsToday = todayFollowUps.filter((item) => item.followup_date === today).length;
  const totalInteractions = interactions.length;
  const pendingFollowups = todayFollowUps.length;

  // Chart Data preparation: Group interactions of the last 7 days
  const getChartData = () => {
    const data = [];
    const dateMap = {};
    
    // Seed last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoStr = d.toISOString().split('T')[0];
      dateMap[isoStr] = { date: dateStr, count: 0 };
    }

    // Populate counts
    interactions.forEach((item) => {
      const itemDate = item.created_at?.split('T')[0];
      if (dateMap[itemDate]) {
        dateMap[itemDate].count += 1;
      }
    });

    Object.keys(dateMap).sort().forEach((key) => {
      data.push(dateMap[key]);
    });

    return data;
  };

  const chartData = getChartData();

  return (
    <Box>
      {/* Dashboard Title & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's a summary of your medical representative operations today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={handleRefresh} disabled={loading || refreshing} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/log')}
          >
            Log Interaction
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Metric 1: Today's Meetings */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
            <Card sx={{ position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(13, 148, 136, 0.1)', p: 1.5, borderRadius: 3, color: 'primary.main', mr: 2 }}>
                  <Calendar size={24} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Today's Meetings
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {loading ? <Skeleton width={40} /> : meetingsToday}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Metric 2: Interactions Logged */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', p: 1.5, borderRadius: 3, color: 'secondary.main', mr: 2 }}>
                  <Layers size={24} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Interactions Logged
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {loading ? <Skeleton width={40} /> : totalInteractions}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Metric 3: Pending Follow-ups */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', p: 1.5, borderRadius: 3, color: '#EF4444', mr: 2 }}>
                  <Clock size={24} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Pending Follow-ups
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {loading ? <Skeleton width={40} /> : pendingFollowups}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Metric 4: AI Assistant Quick Action */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                border: '1px solid rgba(13, 148, 136, 0.2)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ bgcolor: 'primary.main', p: 1.5, borderRadius: 3, color: '#ffffff', mr: 2 }}>
                    <Sparkles size={24} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      AI CRM Assistant
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Log via conversation
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={() => navigate('/log')}
                  sx={{ minWidth: 0, p: 1, borderRadius: '50%' }}
                >
                  <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Main Content Layout */}
      <Grid container spacing={4}>
        {/* Left Column: Analytics Chart & Weekly Summary */}
        <Grid item xs={12} lg={8}>
          {/* Analytics Chart */}
          <Card sx={{ mb: 4, p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp size={20} className="text-teal" />
                  Interaction Trends
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last 7 days
                </Typography>
              </Box>
              <Box sx={{ height: 260 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tickLine={false} style={{ fontSize: 11 }} />
                      <YAxis tickLine={false} style={{ fontSize: 11 }} allowDecimals={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#0D9488"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorTeal)"
                        name="Interactions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Recent Interactions Table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Recent Interactions</Typography>
                <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => setOpenAllDialog(true)}>
                  View All
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'divider' }}>
                <Table sx={{ minWidth: 600 }} aria-label="recent interactions table">
                  <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Hospital</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Products</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Follow-up</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(3)).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={85} /></TableCell>
                        </TableRow>
                      ))
                    ) : interactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            No interactions logged yet. Get started by logging one.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      interactions.slice(0, 5).map((row) => (
                        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {row.doctor?.doctor_name || row.doctor_name || 'Dr. Unknown'}
                          </TableCell>
                          <TableCell>{row.doctor?.hospital || row.hospital || 'N/A'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {(row.products || '').split(',').map((p) => p.trim()).filter(Boolean).slice(0, 2).map((prod, i) => (
                                <Chip key={i} label={prod} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            {row.followup_date ? (
                              <Chip
                                label={row.followup_date}
                                size="small"
                                color="secondary"
                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">None</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Weekly Executive Summary & Pending Followups */}
        <Grid item xs={12} lg={4}>
          {/* Executive Summary Card */}
          <Card
            sx={{
              mb: 4,
              backgroundImage: (theme) => theme.palette.mode === 'dark'
                ? 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.1), transparent)'
                : 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.05), transparent)',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Sparkles size={20} className="text-indigo" />
                AI Weekly Executive Summary
              </Typography>
              <Box
                sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 2.5,
                  borderRadius: 3,
                }}
              >
                {loading ? (
                  <Box>
                    <Skeleton height={20} width="100%" sx={{ mb: 1 }} />
                    <Skeleton height={20} width="95%" sx={{ mb: 1 }} />
                    <Skeleton height={20} width="90%" sx={{ mb: 1 }} />
                    <Skeleton height={20} width="70%" />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.7 }}>
                    "{weeklySummary || 'No interactions logged yet this week. Log a few interactions to generate your executive summary.'}"
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Pending Follow-ups Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Pending Follow-ups
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loading ? (
                  Array.from(new Array(2)).map((_, idx) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Skeleton width="60%" />
                      <Skeleton width="40%" />
                    </Box>
                  ))
                ) : todayFollowUps.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No pending follow-ups. Good job!
                  </Typography>
                ) : (
                  todayFollowUps.slice(0, 4).map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
                        borderLeft: '4px solid',
                        borderLeftColor: 'secondary.main',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeftWidth: 4,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {item.doctor?.doctor_name || item.doctor_name || 'Dr. Unknown'}
                        </Typography>
                        <Chip
                          label={item.followup_date}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                        Notes: {item.summary || 'Follow up on discussion.'}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View All Interactions Dialog */}
      <Dialog
        open={openAllDialog}
        onClose={() => setOpenAllDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            All Logged Interactions ({interactions.length})
          </Typography>
          <TextField
            placeholder="Search by doctor, hospital, products, notes..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 320 }}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', maxHeight: '60vh' }}>
            <Table stickyHeader aria-label="all interactions table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hospital</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Products</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Follow-up</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Summary & Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInteractions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No matching interactions found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInteractions.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {row.doctor?.doctor_name || row.doctor_name || 'Dr. Unknown'}
                      </TableCell>
                      <TableCell>{row.doctor?.hospital || row.hospital || 'N/A'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(row.products || '').split(',').map((p) => p.trim()).filter(Boolean).map((prod, i) => (
                            <Chip key={i} label={prod} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        {row.followup_date ? (
                          <Chip
                            label={row.followup_date}
                            size="small"
                            color="secondary"
                            sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 350 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }} color="text.primary">
                          {row.summary}
                        </Typography>
                        {row.notes && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                            {row.notes}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenAllDialog(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
