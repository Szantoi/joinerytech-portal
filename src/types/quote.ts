export interface CutPieceInput {
  materialCode: string;
  length: number;
  width: number;
  quantity: number;
  edgeBanding: 'None' | 'All' | 'Custom';
}

export interface Material {
  code: string;
  name: string;
  thickness: number;
  category: string;
}

export interface QuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pieces: CutPieceInput[];
}
