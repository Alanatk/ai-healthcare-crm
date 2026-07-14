import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addInteractionSuccess } from '../store/interactionSlice';
import { clearExtractedData } from '../store/chatSlice';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Save, RefreshCw, FileText } from 'lucide-react';

export default function InteractionForm() {
  const dispatch = useDispatch();
  const extractedData = useSelector((state) => state.chat.extractedData);

  const [formData, setFormData] = useState({
    doctor_name: '',
    hospital: '',
    products: '',
    summary: '',
    notes: '',
    followup_date: '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fill form fields when AI extracts structured data
  useEffect(() => {
    if (extractedData) {
      setFormData((prev) => ({
        ...prev,
        doctor_name: extractedData.doctor_name || prev.doctor_name,
        hospital: extractedData.hospital || prev.hospital,
        products: extractedData.products || prev.products,
        summary: extractedData.summary || prev.summary,
        notes: extractedData.notes || prev.notes,
        followup_date: extractedData.followup_date || prev.followup_date,
      }));
    }
  }, [extractedData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearForm = () => {
    setFormData({
      doctor_name: '',
      hospital: '',
      products: '',
      summary: '',
      notes: '',
      followup_date: '',
    });
    setSuccess(false);
    setError(null);
    dispatch(clearExtractedData());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await axios.post('/api/interaction', formData);
      dispatch(addInteractionSuccess(response.data));
      setSuccess(true);
      // Keep form loaded, but clear extracted data in Redux
      dispatch(clearExtractedData());
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save interaction. Please check the inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={20} className="text-teal" />
            Structured Log Form
          </Typography>
          <Button size="small" variant="outlined" onClick={handleClearForm} startIcon={<RefreshCw size={14} />}>
            Reset
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
            Interaction successfully logged and saved to the CRM database!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {extractedData && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: '8px' }}>
            AI has pre-filled the form based on your conversation. Review and save below.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Doctor Name"
              name="doctor_name"
              variant="outlined"
              fullWidth
              required
              value={formData.doctor_name}
              onChange={handleChange}
              placeholder="e.g. Dr. Thomas"
            />
            <TextField
              label="Hospital / Clinic"
              name="hospital"
              variant="outlined"
              fullWidth
              required
              value={formData.hospital}
              onChange={handleChange}
              placeholder="e.g. St. Jude Hospital"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Products Discussed"
              name="products"
              variant="outlined"
              fullWidth
              value={formData.products}
              onChange={handleChange}
              placeholder="e.g. Lipitor, Diabetes Medicine (comma separated)"
            />
            <TextField
              label="Follow-up Date"
              name="followup_date"
              type="date"
              variant="outlined"
              fullWidth
              value={formData.followup_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            label="Purpose & Summary (Outcome)"
            name="summary"
            variant="outlined"
            fullWidth
            required
            value={formData.summary}
            onChange={handleChange}
            placeholder="e.g. Discussed new dosage guidelines. Dr. Thomas is interested in clinical trial results."
          />

          <TextField
            label="Meeting Notes (Additional details)"
            name="notes"
            variant="outlined"
            fullWidth
            multiline
            rows={5}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Type any detailed observations or discussion history here..."
          />

          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
              sx={{ py: 1.5 }}
            >
              {saving ? 'Saving Interaction...' : 'Save Interaction'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
