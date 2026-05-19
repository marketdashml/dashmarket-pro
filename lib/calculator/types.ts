// ─── Calculator types ─────────────────────────────────────────────────────────
// Ported from calculamarket/remix-of-calcula-nova

export type CalcMode = "price" | "margin" | "profit";

export interface CalculatorInput {
  name: string;
  sku: string;
  marketplace: string;
  productCost: number;
  sellingPrice: number;
  commissionPercentage: number;
  fixedFee: number;
  taxPercentage: number;
  shippingCost: number;
  packagingCost: number;
  storageCost: number;
  collectionCost: number;
  operationalCost: number;
  promotionCredit: number;
  affiliateCommissionPercentage: number;
  tacosPercentage: number;
  desiredProfitMargin?: number;
  desiredProfitAmount?: number;
}

export interface CalculatorResult {
  sellingPrice: number;
  productCost: number;
  commission: number;
  fixedFee: number;
  taxes: number;
  shippingCost: number;
  packagingCost: number;
  storageCost: number;
  collectionCost: number;
  operationalCost: number;
  promotionCredit: number;
  affiliateCommission: number;
  tacosCost: number;
  tacosPercentage: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  markup: number;
}

export interface SavedProduct {
  id: string;
  name: string;
  sku: string;
  marketplace: string;
  input: CalculatorInput;
  result: CalculatorResult;
  savedAt: string;
}

export interface WhatIfAdjustment {
  priceAdjust: number;       // %
  commissionAdjust: number;  // pp
  shippingAdjust: number;    // R$
  taxAdjust: number;         // pp
}

export interface WhatIfResult {
  newPrice: number;
  netProfit: number;
  profitMargin: number;
  originalProfit: number;
  originalMargin: number;
  profitDiff: number;
  marginDiff: number;
}
