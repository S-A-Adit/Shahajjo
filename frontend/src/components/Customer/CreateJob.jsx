import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, PlusCircle } from 'lucide-react';

export default function CreateJob({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    service_type: 'Cleaner',
    scheduled_time: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/customer/jobs', {
        ...formData,
        latitude: user.latitude,
        longitude: user.longitude
      });
      navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="w-full max-w-md z-10 glass-panel rounded-2xl p-8 hover-lift">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-800 to-brand-600">
            Request Domestic Help
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Service Required</label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/70 focus:bg-white focus:ring-2 focus:ring-brand-400 outline-none"
            >
              <option>Cleaner</option>
              <option>Cook</option>
              <option>Babysitter</option>
              <option>Elderly Caregiver</option>
              <option>Laundry Helper</option>
              <option>Part-time Maid</option>
              <option>Full-time Maid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">When do you need them?</label>
            <input
              type="text"
              name="scheduled_time"
              value={formData.scheduled_time}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/70 focus:bg-white focus:ring-2 focus:ring-brand-400 outline-none"
              placeholder="e.g., Tomorrow at 9:00 AM"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description / Requirements</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/70 focus:bg-white focus:ring-2 focus:ring-brand-400 outline-none h-32 resize-none"
              placeholder="Any specific instructions for the worker..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium shadow-md transition-all flex items-center justify-center"
          >
            {loading ? 'Submitting...' : 'Post Request'}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </button>
          <div className="text-center mt-4">
            <Link to="/customer" className="text-sm text-brand-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
