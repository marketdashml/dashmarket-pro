export interface MarketplacePreset {
  id: string;
  name: string;
  commissionPercentage: number;
  fixedFee: number;
  note?: string;
}

export const MARKETPLACE_PRESETS: MarketplacePreset[] = [
  { id: "ml-classico",      name: "ML Clássico",         commissionPercentage: 11,  fixedFee: 0    },
  { id: "ml-premium",       name: "ML Premium",           commissionPercentage: 16,  fixedFee: 0    },
  { id: "ml-premium-full",  name: "ML Premium Full",      commissionPercentage: 16,  fixedFee: 0,  note: "Inclua coleta e armazenagem" },
  { id: "shopee-ate80",     name: "Shopee (até R$79)",    commissionPercentage: 20,  fixedFee: 4    },
  { id: "shopee-80-200",    name: "Shopee (R$80–R$199)",  commissionPercentage: 14,  fixedFee: 16   },
  { id: "shopee-200-500",   name: "Shopee (R$200–R$499)", commissionPercentage: 14,  fixedFee: 26   },
  { id: "amazon",           name: "Amazon",               commissionPercentage: 15,  fixedFee: 0    },
  { id: "magalu",           name: "Magalu",               commissionPercentage: 16,  fixedFee: 0    },
  { id: "americanas",       name: "Americanas",           commissionPercentage: 14,  fixedFee: 0    },
  { id: "custom",           name: "Personalizado",        commissionPercentage: 0,   fixedFee: 0    }
];

/** Auto-selects the correct Shopee preset based on price */
export function getShopeePreset(price: number): MarketplacePreset {
  if (price < 80) return MARKETPLACE_PRESETS.find(p => p.id === "shopee-ate80")!;
  if (price < 200) return MARKETPLACE_PRESETS.find(p => p.id === "shopee-80-200")!;
  return MARKETPLACE_PRESETS.find(p => p.id === "shopee-200-500")!;
}

export function getPreset(id: string): MarketplacePreset {
  return MARKETPLACE_PRESETS.find(p => p.id === id) ?? MARKETPLACE_PRESETS.at(-1)!;
}
