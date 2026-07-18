import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Bell, Check, X, Briefcase, MapPin, CheckCircle, Power, User, Star } from 'lucide-react';
import { i18n } from '../../i18n';
import MockSMS from './MockSMS';

export default function WorkerDashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [availability, setAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Worker ratings profile state
  const [ratingsInfo, setRatingsInfo] = useState({ avgRating: 0, totalReviews: 0, reviews: [] });

  const fetchData = async () => {
    try {
      const [notifRes, jobsRes, ratingsRes] = await Promise.all([
        axios.get('/worker/notifications'),
        axios.get('/worker/my-jobs'),
        axios.get('/worker/ratings')
      ]);
      setNotifications(notifRes.data);
      setJobs(jobsRes.data);
      setRatingsInfo(ratingsRes.data);
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

  const toggleAvailability = async () => {
    try {
      const newStatus = !availability;
      await axios.post('/worker/availability', { availability: newStatus });
      setAvailability(newStatus);
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const handleAction = async (id, action) => {
    setLoading(true);
    try {
      await axios.post(`/worker/notifications/${id}/${action}`);
      fetchData();
      if (action === 'accept') setActiveTab('jobs');
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} job`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-dark-50">
      {/* Header */}
      <header className="bg-white border-b border-dark-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">{i18n.t('appTitle')} ({i18n.t('roleWorker')})</h1>
          <div className="flex items-center gap-4">
             <div className="flex items-center text-sm font-medium text-dark-800 bg-dark-50 px-3 py-1.5 rounded-full">
               <User className="w-4 h-4 mr-2 text-brand-600" />
               {user.name}
               {ratingsInfo.avgRating > 0 && (
                 <span className="ml-2 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold text-xs">
                   <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                   {ratingsInfo.avgRating}
                 </span>
               )}
             </div>
            <button onClick={handleLogout} className="text-dark-900/60 hover:text-red-500 transition-colors p-2" title={i18n.t('logout')}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        
        {/* Availability Toggle */}
        <div className="bg-white p-6 rounded-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-dark-100 shadow-sm">
          <div>
            <h2 className="text-lg font-bold">{i18n.t('availabilityStatus')}</h2>
            <p className="text-sm text-dark-900/60">{i18n.lang === 'bn' ? 'আশেপাশে কাজের এলার্ট পেতে অন করুন।' : 'Turn on availability to receive job requests nearby.'}</p>
          </div>
          <button 
            onClick={toggleAvailability}
            className={`px-6 py-3 rounded-xl font-bold flex items-center transition-all shadow-sm ${availability ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-dark-200 text-dark-600 hover:bg-dark-300'}`}
          >
            <Power className="w-5 h-5 mr-2" />
            {availability ? i18n.t('available') : i18n.t('unavailable')}
          </button>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-dark-100 w-fit">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center ${activeTab === 'notifications' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-900/60 hover:text-dark-800 hover:bg-dark-50'}`}
          >
            <Bell className="w-4 h-4 mr-2" /> {i18n.t('navNotifications')}
            {notifications.filter(n => n.status === 'sent').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {notifications.filter(n => n.status === 'sent').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center ${activeTab === 'jobs' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-900/60 hover:text-dark-800 hover:bg-dark-50'}`}
          >
            <Briefcase className="w-4 h-4 mr-2" /> {i18n.t('navMyJobs')}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center ${activeTab === 'reviews' ? 'bg-brand-600 text-white shadow-md' : 'text-dark-900/60 hover:text-dark-800 hover:bg-dark-50'}`}
          >
            <Star className="w-4 h-4 mr-2" /> {i18n.t('reviews')}
          </button>
        </div>

        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-2xl">
            {notifications.length === 0 && <p className="text-dark-900/50 italic">{i18n.t('noNotifications')}</p>}
            
            {notifications.map(notif => (
              <div key={notif.id} className={`p-6 rounded-2xl border shadow-sm transition-all ${notif.status === 'sent' ? 'bg-white border-brand-200 hover:shadow-md' : 'bg-dark-50 border-dark-100 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{i18n.t(notif.service_type)}</span>
                    <p className="font-medium text-lg mt-3">{notif.message}</p>
                    {notif.description && <p className="text-sm text-dark-900/70 mt-2 bg-dark-50 p-3 rounded-lg">"{notif.description}"</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    notif.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    notif.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                    notif.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-dark-200 text-dark-600'
                  }`}>
                    {i18n.t(notif.status)}
                  </span>
                </div>
                
                {notif.status === 'sent' && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-dark-100">
                    <button 
                      onClick={() => handleAction(notif.id, 'accept')}
                      disabled={loading}
                      className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Accept Job
                    </button>
                    <button 
                      onClick={() => handleAction(notif.id, 'reject')}
                      disabled={loading}
                      className="flex-1 bg-white border border-dark-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-dark-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4 mr-1.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-4 max-w-3xl">
            {jobs.length === 0 && <p className="text-dark-900/50 italic">{i18n.t('noBookings')}</p>}
            
            {jobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-2xl border border-dark-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start border-b border-dark-100 pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-dark-800">{job.customer_name}</h3>
                    <p className="text-brand-600 font-medium flex items-center mt-1"><CheckCircle className="w-4 h-4 mr-1.5" /> Booking Confirmed</p>
                  </div>
                  <a href={`tel:${job.customer_phone}`} className="bg-dark-50 text-dark-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-100 transition-colors">
                    Call: {job.customer_phone}
                  </a>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-dark-900/50 block mb-1">Schedule</span>
                    <p className="font-medium">{job.scheduled_time}</p>
                  </div>
                  <div>
                    <span className="text-dark-900/50 block mb-1">Service Requested</span>
                    <p className="font-medium">{i18n.t(job.service_type)}</p>
                  </div>
                  {job.description && (
                    <div className="col-span-1 md:col-span-2">
                      <span className="text-dark-900/50 block mb-1">Instructions</span>
                      <p className="bg-dark-50 p-3 rounded-lg text-dark-800">{job.description}</p>
                    </div>
                  )}
                </div>

                {job.submitted_rating && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
                    <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                      Customer Review: {job.submitted_rating} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    {job.submitted_comment && <p className="italic text-dark-700">"{job.submitted_comment}"</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4 max-w-2xl bg-white p-6 rounded-2xl border border-dark-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6 border-b border-dark-100 pb-4">
              <div className="text-4xl font-extrabold text-amber-600">{ratingsInfo.avgRating}</div>
              <div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${ratingsInfo.avgRating >= s ? 'fill-amber-400 text-amber-400' : 'text-dark-200'}`} />
                  ))}
                </div>
                <div className="text-xs text-dark-500 mt-1 capitalize">{ratingsInfo.totalReviews} {i18n.t('totalReviews')}</div>
              </div>
            </div>

            {ratingsInfo.reviews.length === 0 ? (
              <p className="italic text-dark-900/50">No customer reviews yet.</p>
            ) : (
              <div className="divide-y divide-dark-100 space-y-4">
                {ratingsInfo.reviews.map((r, i) => (
                  <div key={i} className="pt-4 first:pt-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-dark-800">{r.customer_name}</span>
                      <span className="text-dark-900/40">{r.created_at}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-dark-200'}`} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm text-dark-700 italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Mock SMS Console */}
      <MockSMS user={user} />
    </div>
  );
}
