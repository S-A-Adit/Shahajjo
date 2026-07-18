import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, ArrowRight } from 'lucide-react';
import { i18n } from '../../i18n';

export default function Login({ setUser }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', { phone, password });
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="w-full max-w-md z-10 glass-panel rounded-2xl p-8 hover-lift">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-800 to-brand-600">{i18n.t('welcomeTitle')}</h2>
          <p className="text-dark-900/60 mt-2">{i18n.t('welcomeSubtitle')}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">{i18n.t('phone')}</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all outline-none"
              placeholder="e.g. 01712345678"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">{i18n.t('password')}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? i18n.t('signingIn') : i18n.t('signInBtn')}
            {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-dark-900/60">
          {i18n.t('dontHaveAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            {i18n.t('registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
