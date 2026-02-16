// types.ts
export interface InvestmentDTO {
  investmentId?: number;
  createdAt?: string;
  createdBy?: string;
  cropId?: number;
  description?: string;
  investable?: number;
  invested?: number;
  partnerId?: number;
  partnerName?: string;
  share?: number;
  soldAmount?: number;
  withdrawn?: number;
  comments?: string;
  investmentGroupId?: number;
  totalAmount?: number;
  imageUrl?: string;
  splitType?: string;
  supplierName?: string;
  supplierId?: number;
  updatedBy?: string;
  reduceLeftOver?: number;
  reduceLeftOverFlag?: string;
  transactionType?: string;
  images?: any[];
  availableMoney?: number;
}
