import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle } from 'lucide-react';

export default function MockSMS({ user }) {
  const [lastMessage, setLastMessage] = useState('');

  const fetchLast = async () => {
    try {
      const res = await axios.get('/worker/notifications');
      const notifs = res.data;
      if (Array.isArray(notifs) && notifs.length > 0) {
        const latest = notifs.reduce((a, b) => (a.id > b.id ? a : b));
        setLastMessage(latest.message);
      } else {
        setLastMessage('');
      }
    } catch (err) {
      // ignore errors
    }
  };

  useEffect(() => {
    fetchLast();
    const interval = setInterval(fetchLast, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full glass-panel p-4 shadow-lg">
      <div className="flex items-center mb-2">
        <MessageCircle className="w-5 h-5 mr-2 text-brand-600" />
        <span className="font-medium">Mock SMS</span>
      </div>
      <div className="text-sm text-dark-800">
        {lastMessage ? lastMessage : 'No new messages'}
      </div>
    </div>
  );
}
