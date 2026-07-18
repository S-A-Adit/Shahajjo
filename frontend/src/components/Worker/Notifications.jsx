import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

export default function WorkerNotifications({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/worker/notifications');
      setNotifications(res.data);
    } catch (err) {
      setError('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (id, action) => {
    setLoading(true);
    try {
      await axios.post(`/worker/notifications/${id}/${action}`);
      await fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen pb-12 bg-dark-50">
      <header className="bg-white border-b border-dark-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
            Shahajjo Worker – Notifications
          </h1>
          <Link to="/worker" className="text-brand-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
            {error}
          </div>
        )}
        {notifications.length === 0 ? (
          <p className="text-dark-900/50 italic">No pending notifications.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-6 rounded-2xl border shadow-sm transition-all ${notif.status === 'sent' ? 'bg-white border-brand-200' : 'bg-dark-50 border-dark-100 opacity-70'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {notif.service_type}
                    </span>
                    <p className="font-medium text-lg mt-3">{notif.message}</p>
                    {notif.description && (
                      <p className="text-sm text-dark-900/70 mt-2 bg-dark-50 p-3 rounded-lg">{notif.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      notif.status === 'sent'
                        ? 'bg-blue-100 text-blue-700'
                        : notif.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {notif.status.toUpperCase()}
                  </span>
                </div>
                {notif.status === 'sent' && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-dark-100">
                    <button
                      onClick={() => handleAction(notif.id, 'accept')}
                      disabled={loading}
                      className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleAction(notif.id, 'reject')}
                      disabled={loading}
                      className="flex-1 bg-white border border-dark-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-dark-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center disabled:opacity-50"
                    >
                      <X className="w-4 h-4 mr-1.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
