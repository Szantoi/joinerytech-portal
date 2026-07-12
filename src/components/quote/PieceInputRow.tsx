import { Input } from '../ui';
import type { CutPieceInput, Material } from '../../types/quote';

interface PieceInputRowProps {
  piece: CutPieceInput;
  materials: Material[];
  onChange: (piece: CutPieceInput) => void;
  onRemove: () => void;
  showRemove: boolean;
}

export function PieceInputRow({ piece, materials, onChange, onRemove, showRemove }: PieceInputRowProps) {
  const materialId = `material-${piece.materialCode || Math.random()}`;
  const edgeBandingId = `edgebanding-${piece.materialCode || Math.random()}`;

  return (
    <div className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label htmlFor={materialId} className="block text-sm font-medium text-gray-700 mb-1">
          Anyag <span className="text-red-500">*</span>
        </label>
        <select
          id={materialId}
          value={piece.materialCode}
          onChange={(e) => onChange({ ...piece, materialCode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Válasszon anyagot...</option>
          {materials.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name} ({m.thickness}mm)
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Hossz (mm)"
        type="number"
        min="10"
        max="3000"
        value={piece.length || ''}
        onChange={(e) => onChange({ ...piece, length: Number(e.target.value) })}
        className="w-32"
        required
      />

      <Input
        label="Szélesség (mm)"
        type="number"
        min="10"
        max="3000"
        value={piece.width || ''}
        onChange={(e) => onChange({ ...piece, width: Number(e.target.value) })}
        className="w-32"
        required
      />

      <Input
        label="Darab"
        type="number"
        min="1"
        value={piece.quantity || ''}
        onChange={(e) => onChange({ ...piece, quantity: Number(e.target.value) })}
        className="w-24"
        required
      />

      <div className="w-40">
        <label htmlFor={edgeBandingId} className="block text-sm font-medium text-gray-700 mb-1">
          Éllezés <span className="text-red-500">*</span>
        </label>
        <select
          id={edgeBandingId}
          value={piece.edgeBanding}
          onChange={(e) => onChange({ ...piece, edgeBanding: e.target.value as CutPieceInput['edgeBanding'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="None">Nincs</option>
          <option value="All">Mind 4 él</option>
          <option value="Custom">Egyedi</option>
        </select>
      </div>

      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors font-bold"
          aria-label="Tétel törlése"
        >
          ✕
        </button>
      )}
    </div>
  );
}
