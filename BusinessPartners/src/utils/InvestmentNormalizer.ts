import { InvestmentDTO } from "../types/types";

export const normalizeInvestmentForEdit = (
  rows: InvestmentDTO[],
): InvestmentDTO[] => {
  if (!rows || !rows.length) return [];

  return rows.map((inv) => {
    const type = inv.transactionType?.toUpperCase();

    // SOLD
    if (type === "SOLD") {
      return {
        ...inv,
        transactionType: "Sold",
        invested: 0,
        investable: 0,
        withdrawn: 0,
        soldAmount: Number(inv.soldAmount ?? 0),
      };
    }

    // WITHDRAW
    if (type === "WITHDRAW") {
      return {
        ...inv,
        transactionType: "Withdraw",
        invested: 0,
        investable: 0,
        soldAmount: 0,
        withdrawn: Number(inv.withdrawn ?? 0),
      };
    }

    // INVESTMENT_WITHDRAW
    if (type === "INVESTMENT_WITHDRAW") {
      return {
        ...inv,
        transactionType: "Investment_Withdraw",
        invested: 0,
        investable: 0,
        soldAmount: 0,
        withdrawn: Number(inv.withdrawn ?? 0),
      };
    }

    // INVESTMENT
    return {
      ...inv,
      transactionType: "Investment",
      invested: Number(inv.invested ?? 0),
      investable: Number(inv.investable ?? inv.invested ?? 0),
      soldAmount: 0,
      withdrawn: 0,
    };
  });
};
