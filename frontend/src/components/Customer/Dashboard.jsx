import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, PlusCircle, Clock, MapPin, CheckCircle, Search, User, XCircle, Star } from 'lucide-react';
import { i18n } from '../../i18n';

export default function CustomerDashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_type: 'Cleaner', scheduled_time: '', description: ''
  });
  const [matchedWorkers, setMatchedWorkers] = useState([]);
  const [matchingJobId, setMatchingJobId] = useState(null);
  
  // Rating states
  const [ratingBookingId, setRatingBookingId] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const fetchData = async () => {
    try {
      const [bookingsRes, jobsRes] = await Promise.all([
        axios.get('/customer/bookings'),
        axios.get('/customer/jobs')
      ]);
      setBookings(bookingsRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await axios.post('/auth/logout');
    setUser(null);
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm(i18n.t('cancelJob') + '?')) return;
    setLoading(true);
    try {
      await axios.post(`/customer/cancel/${jobId}`);
      fetchData();
    } catch (err) {
      alert('Failed to cancel job request');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/customer/bookings/${ratingBookingId}/rate`, {
        rating: ratingScore,
        comment: ratingComment
      });
      setRatingBookingId(null);
      setRatingComment('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (jobId) => {
    setLoading(true);
    setMatchingJobId(jobId);
    try {
      const res = await axios.post(`/customer/match/${jobId}`);
      setMatchedWorkers(res.data.workers);
      if (res.data.workers.length === 0) {
        alert(i18n.lang === 'bn' ? 'আশেপাশে কোনো কর্মী পাওয়া যায়নি।' : 'No workers found nearby at this time.');
      } else {
        alert(i18n.lang === 'bn' ? `${res.data.workers.length} জন কর্মীর সাথে মেলবন্ধন করা হয়েছে! অ্যালার্ট পাঠানো হয়েছে।` : `Matched with ${res.data.workers.length} worker(s). Notifications sent!`);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/customer/jobs', {
        ...formData,
        latitude: user.latitude,
        longitude: user.longitude
      });
      setFormData({
        service_type: 'Cleaner', scheduled_time: '', description: ''
      });
      setActiveTab('jobs');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen pb-12 bg-dark-50">
      {/* Header */}
      <header className="bg-white border-b border-dark-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">{i18n.t('appTitle')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm font-medium text-dark-800 bg-dark-50 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4 mr-2 text-brand-600" />
              {user.name} ({i18n.t('roleCustomer')})
            </div>
            <button onClick={handleLogout} className="text-dark-900/60 hover:text-red-500 transition-colors p-2" title={i18n.t('logout')}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* Dashboard Tabs */}
        <div className="flex gap-2 mb-8 bg-white/50 p-1.5 rounded-2xl border border-dark-100 w-fit">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'bookings' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-900/60 hover:text-dark-800 hover:bg-white/60'}`}
          >
            {i18n.t('navMyJobs')}
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'jobs' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-900/60 hover:text-dark-800 hover:bg-white/60'}`}
          >
            {i18n.t('jobHistory')}
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-900/60 hover:text-dark-800 hover:bg-white/60'}`}
          >
            <PlusCircle className="w-4 h-4 inline-block mr-1.5 mb-0.5" /> {i18n.t('navCreateJob')}
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="max-w-lg bg-white p-6 rounded-2xl border border-dark-100 shadow-sm">
            <h2 className="text-xl font-bold mb-4">{i18n.t('requestService')}</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{i18n.t('selectCategory')}</label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full rounded-xl border-dark-200"
                >
                  <option value="Cleaner">{i18n.t('Cleaner')}</option>
                  <option value="Cook">{i18n.t('Cook')}</option>
                  <option value="Babysitter">{i18n.t('Babysitter')}</option>
                  <option value="Elderly Caregiver">{i18n.t('Elderly Caregiver')}</option>
                  <option value="Laundry Helper">{i18n.t('Laundry Helper')}</option>
                  <option value="Part-time Maid">{i18n.t('Part-time Maid')}</option>
                  <option value="Full-time Maid">{i18n.t('Full-time Maid')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{i18n.t('scheduledTime')}</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full rounded-xl border-dark-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{i18n.t('description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border-dark-200"
                  rows="3"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl font-medium shadow-md transition-colors"
              >
                {loading ? '...' : i18n.t('findMatches')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-bold mb-4">{i18n.t('jobHistory')}</h2>
            {jobs.length === 0 && <p className="text-dark-900/50 italic">{i18n.t('noNotifications')}</p>}
            
            {jobs.map(job => (
              <div key={job.id} className="bg-white p-6 border border-dark-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift shadow-sm">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{i18n.t(job.service_type)}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${job.status === 'open' ? 'bg-amber-100 text-amber-700' : job.status === 'matched' ? 'bg-emerald-100 text-emerald-700' : job.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-dark-100 text-dark-600'}`}>
                      {i18n.t(job.status)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-800 flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-dark-900/40" /> {job.scheduled_time}
                  </p>
                  {job.description && <p className="text-sm text-dark-900/60 mt-2">{job.description}</p>}
                </div>
                
                <div className="flex gap-2">
                  {job.status === 'open' && (
                    <button 
                      onClick={() => handleMatch(job.id)}
                      disabled={loading && matchingJobId === job.id}
                      className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center shadow-sm disabled:opacity-50"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {loading && matchingJobId === job.id ? '...' : i18n.t('findMatches')}
                    </button>
                  )}
                  {(job.status === 'open' || job.status === 'matched') && (
                    <button 
                      onClick={() => handleCancelJob(job.id)}
                      disabled={loading}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      {i18n.t('cancelJob')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-xl font-bold mb-4">{i18n.t('recentJobs')}</h2>
            {bookings.length === 0 && <p className="text-dark-900/50 italic">{i18n.t('noBookings')}</p>}
            
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{booking.worker_name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-brand-600">{i18n.t(booking.service_type)}</span>
                      {booking.avg_rating && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {parseFloat(booking.avg_rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-dark-900/70">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {booking.start_time}</span>
                      <span className="flex items-center gap-1.5 font-medium">{i18n.t('phone')}: {booking.worker_phone}</span>
                    </div>

                    {/* Review Info */}
                    {booking.submitted_rating ? (
                      <div className="mt-4 p-3 bg-dark-50 rounded-xl border border-dark-100 text-xs">
                        <span className="font-semibold flex items-center gap-1 mb-1">
                          {i18n.t('ratingScore')}: {booking.submitted_rating} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </span>
                        {booking.submitted_comment && <p className="italic text-dark-600">"{booking.submitted_comment}"</p>}
                      </div>
                    ) : (
                      booking.status !== 'cancelled' && (
                        <button 
                          onClick={() => setRatingBookingId(booking.id)}
                          className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5" /> {i18n.t('rateWorker')}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="self-start text-right">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${booking.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {i18n.t(booking.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Submission Modal Dialog */}
        {ratingBookingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold mb-4">{i18n.t('rateWorker')}</h3>
              <form onSubmit={submitRating} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-900/60 uppercase tracking-wider mb-2">{i18n.t('ratingScore')}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRatingScore(score)}
                        className={`p-2.5 rounded-xl border text-base font-semibold flex-1 flex justify-center items-center gap-1 ${ratingScore === score ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-dark-100 hover:bg-dark-50'}`}
                      >
                        {score} <Star className={`w-4 h-4 ${ratingScore >= score ? 'fill-amber-400 text-amber-400' : 'text-dark-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-900/60 uppercase tracking-wider mb-2">{i18n.t('comment')}</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows="3"
                    className="w-full rounded-xl border-dark-200 focus:border-brand-500 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRatingBookingId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-dark-100 text-sm font-medium hover:bg-dark-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? i18n.t('submitting') : i18n.t('submitRating')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
