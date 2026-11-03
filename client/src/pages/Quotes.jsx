import { useEffect, useState } from 'react';
import { FiHeart, FiRefreshCw, FiCopy, FiFeather } from 'react-icons/fi';
import { favoriteQuote, getFavoriteQuotes, getRandomQuote, removeFavoriteQuote } from '../services/quoteService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['motivation', 'confidence', 'positivity', 'success', 'stress relief', 'self-belief', 'productivity'];

export default function Quotes() {
  const [quote, setQuote] = useState(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const { showToast } = useToast();

  const loadQuote = (cat) => {
    setLoading(true);
    getRandomQuote(cat)
      .then((data) => setQuote(data.quote))
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  const loadFavorites = () => {
    setFavLoading(true);
    getFavoriteQuotes()
      .then((data) => setFavorites(data.favorites))
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setFavLoading(false));
  };

  useEffect(() => {
    loadQuote('');
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!quote) return;
    try {
      await favoriteQuote(quote);
      showToast('Saved to favorites');
      loadFavorites();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleCopy = () => {
    if (!quote) return;
    navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
    showToast('Copied to clipboard');
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await removeFavoriteQuote(id);
      setFavorites((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Motivational Quotes</h1>
        <p>A quote for the moment, in the category that fits how you feel.</p>
      </div>

      <div className="category-row" style={{ marginBottom: 20 }}>
        <button className={`personality-chip ${category === '' ? 'active' : ''}`} onClick={() => { setCategory(''); loadQuote(''); }}>Any</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`personality-chip ${category === c ? 'active' : ''}`} onClick={() => { setCategory(c); loadQuote(c); }}>{c}</button>
        ))}
      </div>

      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        {loading ? (
          <Loading label="Fetching a quote…" />
        ) : quote ? (
          <>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)', margin: '0 auto 12px', maxWidth: '48ch' }}>
              "{quote.text}"
            </p>
            <p className="text-soft">— {quote.author} · <span style={{ textTransform: 'capitalize' }}>{quote.category}</span></p>
            <div className="flex flex-center gap-12 mt-24">
              <button className="btn btn-warm" onClick={handleSave}><FiHeart /> Save</button>
              <button className="btn btn-secondary" onClick={() => loadQuote(category)}><FiRefreshCw /> New quote</button>
              <button className="btn btn-ghost" onClick={handleCopy}><FiCopy /> Copy</button>
            </div>
          </>
        ) : (
          <EmptyState icon={<FiFeather />} title="No quote available" />
        )}
      </div>

      <h2 className="mt-24">Your favorites</h2>
      {favLoading ? (
        <Loading label="Loading favorites…" />
      ) : favorites.length === 0 ? (
        <EmptyState icon={<FiHeart />} title="No favorites yet" description="Save quotes you love and they'll show up here." />
      ) : (
        <div className="grid grid-2 mt-24">
          {favorites.map((f) => (
            <div className="card" key={f._id}>
              <p style={{ fontFamily: 'var(--font-display)' }}>"{f.text}"</p>
              <p className="text-soft">— {f.author}</p>
              <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveFavorite(f._id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
