import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { showToast } from "./ToastService";

/* =========================
   TYPES
========================= */
type Language = "en" | "te";

/* =========================
   TRANSLATIONS (SAFE STATIC)
========================= */
const TRANSLATIONS: Record<Language, any> = {
  en: {
    title: "BizMoney Statement",
    business: "Business",
    downloadedBy: "Downloaded By",
    downloadedOn: "Downloaded On",
    transactions: "Transactions",
    filter: "Filter",

    date: "Date",
    user: "User",
    description: "Description",
    type: "Type",
    split: "Split",
    total: "Total",
    invested: "Invested",
    investable: "Investable",
    sold: "Sold",
    withdraw: "Withdraw",
    createdBy: "Created By",
  },
  te: {
    title: "బిజ్‌మనీ స్టేట్‌మెంట్",
    business: "వ్యాపారం",
    downloadedBy: "డౌన్‌లోడ్ చేసినవారు",
    downloadedOn: "డౌన్‌లోడ్ చేసిన తేదీ",
    transactions: "లావాదేవీలు",
    filter: "ఫిల్టర్",

    date: "తేదీ",
    user: "వినియోగదారు",
    description: "వివరణ",
    type: "రకం",
    split: "విభజన",
    total: "మొత్తం",
    invested: "పేటాల్సింది",
    investable: "పేటింది",
    sold: "అమ్మకం",
    withdraw: "విత్డ్రా",
    createdBy: "సృష్టించినవారు",
  },
};

/* =========================
   FILTER LABELS
========================= */
const FILTER_LABELS: Record<Language, Record<string, string>> = {
  en: {
    byLoggedInUser: "Your Transactions",
    byInvestment: "Your Investments",
    byWithdraw: "Your Withdrawals",
    bySold: "Your Sold Transactions",
    allInvestments: "Everyone's Transactions",
  },
  te: {
    byLoggedInUser: "మీ లావాదేవీలు",
    byInvestment: "మీ పెట్టుబడులు",
    byWithdraw: "మీ విత్డ్రాల్స్",
    bySold: "మీ అమ్మకాలు",
    allInvestments: "అందరి లావాదేవీలు",
  },
};

/* =========================
   MAIN FUNCTION
========================= */
export const generateBusinessStatementPDF = async ({
  businessName,
  downloadedBy,
  transactions,
  language = "en",
  filterType = "allInvestments",
}: {
  businessName: string;
  downloadedBy: string;
  transactions: any[];
  language?: Language;
  filterType?: string;
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const filterLabel =
    FILTER_LABELS[language]?.[filterType] ||
    FILTER_LABELS[language].allInvestments;

  const now = new Date();
  const formattedNow = now.toLocaleString();
  const fileDate = now.toISOString().split("T")[0];
  const fileTime = now.toTimeString().split(" ")[0].replace(/:/g, "-");

  /* =========================
     GROUP COLOR LOGIC
  ========================= */
  const groupColorMap = new Map<string | number, string>();
  const colors = ["#ffffff", "#f3f4f6"];
  let colorIndex = 0;

  transactions.forEach((tx) => {
    const groupId = tx.investmentGroupId ?? "NO_GROUP";
    if (!groupColorMap.has(groupId)) {
      groupColorMap.set(groupId, colors[colorIndex % 2]);
      colorIndex++;
    }
  });

  /* =========================
     ROWS
  ========================= */
  const rowsHtml = transactions
    .map((tx) => {
      const groupId = tx.investmentGroupId ?? "NO_GROUP";
      const bgColor = groupColorMap.get(groupId) || "#ffffff";

      return `
<tr style="background:${bgColor};">
  <td>${formatDate(tx.createdAt)}</td>
  <td>${tx.partnerName || "-"}</td>
  <td>${tx.description || "-"}</td>
  <td>${tx.transactionType || "-"}</td>
  <td style="text-align:center;">${tx.splitType || "-"}</td>
  <td style="text-align:right;">${formatAmount(tx.totalAmount)}</td>
  <td style="text-align:right;">${formatAmount(tx.invested)}</td>
  <td style="text-align:right;">${formatAmount(tx.investable)}</td>
  <td style="text-align:right;">${formatAmount(tx.soldAmount)}</td>
  <td style="text-align:right;">${formatAmount(tx.withdrawn)}</td>
  <td>${tx.createdBy || "-"}</td>
</tr>`;
    })
    .join("");

  /* =========================
     HTML
  ========================= */
  const html = `
<html>
<head>
<style>
  @page { size: A4 landscape; margin: 40px; }

  body { font-family: Arial; font-size: 11px; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }

  th, td { padding: 6px; font-size: 10.5px; word-break: break-word; }

  th { background: #2563eb; color: white; }

  td { border-bottom: 1px solid #e5e7eb; }

  col.date { width: 8%; }
  col.user { width: 8%; }
  col.desc { width: 18%; }
  col.type { width: 14%; }
  col.split { width: 7%; }
  col.total { width: 8%; }
  col.invested { width: 8%; }
  col.investable { width: 8%; }
  col.sold { width: 8%; }
  col.withdraw { width: 8%; }
  col.created { width: 5%; }

  .title {
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: #2563eb;
    margin: 10px 0;
  }

  .meta { font-size: 11px; line-height: 1.6; }

  .footer {
    position: fixed;
    bottom: 10px;
    right: 40px;
    font-size: 10px;
  }

  .footer:after {
    content: "Page " counter(page) " of " counter(pages);
  }
</style>
</head>

<body>

<div class="title">${t.title}</div>

<div class="meta">
  <strong>${t.business}:</strong> ${businessName}<br/>
  <strong>${t.downloadedBy}:</strong> ${downloadedBy}<br/>
  <strong>${t.downloadedOn}:</strong> ${formattedNow}<br/>
  <strong>${t.filter}:</strong> ${filterLabel}
</div>

<h3>${t.transactions}</h3>

<table>
  <colgroup>
    <col class="date"><col class="user"><col class="desc">
    <col class="type"><col class="split"><col class="total">
    <col class="invested"><col class="investable">
    <col class="sold"><col class="withdraw"><col class="created">
  </colgroup>

  <thead>
    <tr>
      <th>${t.date}</th>
      <th>${t.user}</th>
      <th>${t.description}</th>
      <th>${t.type}</th>
      <th>${t.split}</th>
      <th>${t.total}</th>
      <th>${t.invested}</th>
      <th>${t.investable}</th>
      <th>${t.sold}</th>
      <th>${t.withdraw}</th>
      <th>${t.createdBy}</th>
    </tr>
  </thead>

  <tbody>${rowsHtml}</tbody>
</table>

<div class="footer"></div>

</body>
</html>`;

  /* =========================
     FILE GENERATION
  ========================= */
  try {
    const result = await Print.printToFileAsync({ html });

    if (!result?.uri) throw new Error("PDF generation failed");

    const safeBusinessName = businessName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `BizMoney_${safeBusinessName}_${fileDate}_${fileTime}.pdf`;

    const originalFile = new File(result.uri);
    const destinationFile = new File(Paths.cache, fileName);

    originalFile.copy(destinationFile);

    await Sharing.shareAsync(destinationFile.uri, {
      mimeType: "application/pdf",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    showToast("Failed to generate PDF. Please try again: " + message, "error");
  }
};

/* =========================
   HELPERS
========================= */
const formatAmount = (value: any) => {
  if (!value) return "-";
  return "₹" + Number(value).toLocaleString("en-IN");
};

const formatDate = (value: any) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};
