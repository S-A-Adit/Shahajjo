import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CustomerDashboard from './components/Customer/Dashboard';
import WorkerDashboard from './components/Worker/Dashboard';
import WorkerNotifications from './components/Worker/Notifications';
import CreateJob from './components/Customer/CreateJob';
import { i18n } from './i18n';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(i18n.lang);

  useEffect(() => {
    const unsub = i18n.onChange(setLang);
    return unsub;
  }, []);

  useEffect(() => {
    axios.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
    </div>
  );

  return (
    <Router>
      <div className="font-sans text-dark-800 min-h-screen flex flex-col">
        {/* Language Selection Header overlay */}
        <div className="bg-white/80 backdrop-blur-md border-b border-dark-100 py-2 px-6 flex justify-between items-center text-sm sticky top-0 z-50">
          <span className="font-semibold text-brand-600">{i18n.t('appTitle')}</span>
          <div className="flex items-center gap-2">
            <span className="text-dark-500 text-xs font-medium">Language:</span>
            <select 
              value={lang} 
              onChange={(e) => { i18n.lang = e.target.value; }}
              className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-full font-medium transition-colors border border-brand-200 outline-none cursor-pointer text-xs"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to={user.user_type === 'Customer' ? '/customer' : '/worker'} />} />
            <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to={user.user_type === 'Customer' ? '/customer' : '/worker'} />} />
            
            <Route path="/customer/*" element={user?.user_type === 'Customer' ? <CustomerDashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/worker/*" element={user?.user_type === 'Worker' ? <WorkerDashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/worker/notifications" element={user?.user_type === 'Worker' ? <WorkerNotifications user={user} /> : <Navigate to="/login" />} />
            <Route path="/customer/create" element={<CreateJob user={user} />} />
            
            <Route path="*" element={<Navigate to={user ? (user.user_type === 'Customer' ? '/customer' : '/worker') : '/login'} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
