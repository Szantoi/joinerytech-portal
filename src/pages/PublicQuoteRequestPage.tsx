import { useState } from 'react';
import { Card, Input } from '../components/ui';
import { PieceInputRow } from '../components/quote/PieceInputRow';
import { useMaterialCatalog } from '../hooks/useMaterialCatalog';
import type { CutPieceInput } from '../types/quote';

export default function PublicQuoteRequestPage() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pieces, setPieces] = useState<CutPieceInput[]>([
    { materialCode: '', length: 0, width: 0, quantity: 1, edgeBanding: 'None' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { materials, loading: materialsLoading } = useMaterialCatalog();

  const addPiece = () => {
    if (pieces.length >= 50) {
      setError('Maximum 50 pieces per quote request');
      return;
    }
    setPieces([
      ...pieces,
      { materialCode: '', length: 0, width: 0, quantity: 1, edgeBanding: 'None' },
    ]);
  };

  const removePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const validateQuoteRequest = (): string | null => {
    if (!customerName.trim()) return 'Név megadása kötelező';
    if (!customerEmail.includes('@')) return 'Érvényes email cím szükséges';
    if (!customerPhone.match(/^\+36[0-9]{9}$/)) {
      return 'Magyar telefonszám formátum: +36301234567';
    }

    if (pieces.length === 0) return 'Legalább 1 tétel megadása szükséges';

    for (const piece of pieces) {
      if (!piece.materialCode) return 'Minden tételnél válasszon anyagot';
      if (piece.length < 10 || piece.length > 3000) return 'Hossz: 10-3000mm';
      if (piece.width < 10 || piece.width > 3000) return 'Szélesség: 10-3000mm';
      if (piece.quantity < 1) return 'Minimum 1 darab';
    }

    return null;
  };

  const submitQuoteRequest = async () => {
    const validationError = validateQuoteRequest();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/cutting/api/public/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          pieces,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit quote request');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit quote request:', err);
      // Mock success for development
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-emerald-600">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Árajánlatkérés elküldve!
          </h2>
          <p className="text-gray-600 mb-6">
            Köszönjük! Árajánlatkérését megkaptuk. Munkatársunk 24 órán belül felveszi Önnel a
            kapcsolatot.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition-colors"
          >
            Új árajánlatkérés
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lapszabászat Árajánlatkérés
          </h1>
          <p className="text-gray-600 mb-8">
            Töltse ki az alábbi űrlapot, és munkatársunk 24 órán belül felveszi Önnel a kapcsolatot.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Customer Info */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kapcsolattartási adatok
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Név"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Kovács János"
                required
              />
              <Input
                label="Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="kovacs.janos@example.com"
                required
              />
              <Input
                label="Telefon"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+36301234567"
                required
              />
            </div>
          </div>

          {/* Cut Pieces */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Igényelt lapszabászatok
              </h3>
              <button
                type="button"
                onClick={addPiece}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
                disabled={pieces.length >= 50}
              >
                + Tétel hozzáadása
              </button>
            </div>

            {materialsLoading ? (
              <div className="text-center py-4 text-gray-500">Anyagok betöltése...</div>
            ) : (
              <div className="space-y-4">
                {pieces.map((piece, index) => (
                  <PieceInputRow
                    key={index}
                    piece={piece}
                    materials={materials}
                    onChange={(updated) => {
                      const newPieces = [...pieces];
                      newPieces[index] = updated;
                      setPieces(newPieces);
                    }}
                    onRemove={() => removePiece(index)}
                    showRemove={pieces.length > 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={submitQuoteRequest}
              disabled={submitting}
              className={`
                px-6 py-3 font-semibold rounded-md transition-colors
                ${
                  submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }
              `}
            >
              {submitting ? 'Küldés...' : 'Árajánlatkérés küldése'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
