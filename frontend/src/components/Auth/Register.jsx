import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, User, Briefcase, MapPin } from 'lucide-react';
import { i18n } from '../../i18n';

export default function Register({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', phone: '', password: '', user_type: 'Customer',
    service_type: 'Cleaner', experience_years: '', hourly_rate: '',
    latitude: '', longitude: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // For prototype simplicity, allow users to set location coordinates easily.
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({ ...formData, latitude: position.coords.latitude, longitude: position.coords.longitude });
      }, () => {
        // Mock fallback location for Dhanmondi area
        setFormData({ ...formData, latitude: 23.7465, longitude: 90.3760 });
      });
    } else {
      setFormData({ ...formData, latitude: 23.7465, longitude: 90.3760 });
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/auth/register', formData);
      const loginRes = await axios.post('/auth/login', { phone: formData.phone, password: formData.password });
      setUser(loginRes.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      
      <div className="w-full max-w-lg z-10 glass-panel rounded-2xl p-8 hover-lift">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-800 to-brand-600">{i18n.t('register')}</h2>
          <p className="text-dark-900/60 mt-2">{i18n.t('welcomeSubtitle')}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 p-1 bg-white/50 rounded-xl border border-dark-100 mb-6">
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, user_type: 'Customer' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.user_type === 'Customer' ? 'bg-white shadow-sm text-brand-600' : 'text-dark-900/60 hover:text-dark-800'}`}
            >
              <User className="inline-block w-4 h-4 mr-2 mb-0.5" /> {i18n.t('roleCustomer')}
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({ ...formData, user_type: 'Worker' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.user_type === 'Worker' ? 'bg-white shadow-sm text-brand-600' : 'text-dark-900/60 hover:text-dark-800'}`}
            >
              <Briefcase className="inline-block w-4 h-4 mr-2 mb-0.5" /> {i18n.t('roleWorker')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all outline-none" placeholder={i18n.t('fullName')} required />
            </div>
            <div className="col-span-1">
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all outline-none" placeholder={i18n.t('phone')} required />
            </div>
            <div className="col-span-1">
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-dark-100 bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all outline-none" placeholder={i18n.t('password')} required />
            </div>
          </div>

          {formData.user_type === 'Worker' && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-brand-50/50 rounded-xl border border-brand-100">
              <div className="col-span-2">
                <select name="service_type" value={formData.service_type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-brand-200 bg-white focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none">
                  <option value="Cleaner">{i18n.t('Cleaner')}</option>
                  <option value="Cook">{i18n.t('Cook')}</option>
                  <option value="Babysitter">{i18n.t('Babysitter')}</option>
                  <option value="Elderly Caregiver">{i18n.t('Elderly Caregiver')}</option>
                  <option value="Laundry Helper">{i18n.t('Laundry Helper')}</option>
                  <option value="Part-time Maid">{i18n.t('Part-time Maid')}</option>
                  <option value="Full-time Maid">{i18n.t('Full-time Maid')}</option>
                </select>
              </div>
              <div className="col-span-1">
                <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-brand-200 bg-white focus:ring-2 focus:ring-brand-400 outline-none" placeholder={i18n.t('experienceYearsPlaceholder')} required />
              </div>
              <div className="col-span-1">
                <input type="number" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-brand-200 bg-white focus:ring-2 focus:ring-brand-400 outline-none" placeholder={i18n.t('hourlyRatePlaceholder')} required />
              </div>
            </div>
          )}

          <div className="pt-2">
            <div className="flex gap-2">
              <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-dark-100 bg-white/50 focus:bg-white outline-none" placeholder={i18n.t('latitudePlaceholder')} required />
              <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full px-3 py-2 text-sm rounded-lg border border-dark-100 bg-white/50 focus:bg-white outline-none" placeholder={i18n.t('longitudePlaceholder')} required />
              <button type="button" onClick={handleGetLocation} className="px-3 py-2 bg-dark-100 hover:bg-dark-200 rounded-lg transition-colors text-dark-800" title="Get Location">
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-dark-900/40 mt-1">{i18n.t('getLocHint')}</p>
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-medium shadow-md transition-all">
            {loading ? i18n.t('registering') : i18n.t('createAccountBtn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-dark-900/60">
          {i18n.t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            {i18n.t('signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
