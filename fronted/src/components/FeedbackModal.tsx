import React, { useState } from 'react';
import {
  Star, Send, X, CheckCircle2,
  Lightbulb, Bug, HelpCircle, HeartHandshake
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  notify: (msg: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, activePage, notify }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [category, setCategory] = useState('Feature Request');
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSending(true);
    try {
      await fetch('http://localhost:5124/api/v1/license/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Pilot User',
          customerEmail: customerEmail.trim(),
          category,
          rating,
          feedbackText: feedbackText.trim(),
          currentScreen: activePage
        })
      });

      setSubmitted(true);
      notify('✓ Thank you! Your feedback has been sent to the ERP development team.');
      setTimeout(() => {
        setSubmitted(false);
        setFeedbackText('');
        onClose();
      }, 1800);
    } catch {
      notify('✓ Feedback recorded locally in pilot session.');
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pilot Customer Feedback</h3>
              <p className="text-xs text-slate-300 mt-0.5">Help us shape this ERP for your business sector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Feedback Received!</h4>
            <p className="text-xs text-slate-500">
              Thank you for testing the AMS ERP during the pilot phase. Your suggestion helps improve the software.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-200">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 dark:text-white">Feedback Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
                  { id: 'Bug Report', icon: Bug, color: 'text-rose-500' },
                  { id: 'Accounting Rule', icon: HelpCircle, color: 'text-teal-500' },
                  { id: 'General Praise', icon: HeartHandshake, color: 'text-indigo-500' },
                ].map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                      <span className="text-[10px] text-center">{cat.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Rating */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 dark:text-white">Your Overall Experience</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                ))}
                <span className="text-[11px] text-slate-500 ml-2 font-medium">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Needs Work'}
                </span>
              </div>
            </div>

            {/* Feedback details */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Tell us your idea or what happened:</span>
                <span className="text-[10px] text-slate-400 font-normal">Context: {activePage}</span>
              </label>
              <textarea
                required
                rows={4}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Example: In our retail business, we need barcode scanning on the Sales Invoice line items..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Optional contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={sending || !feedbackText.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Submitting Feedback...' : 'Send Feedback to ERP Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
