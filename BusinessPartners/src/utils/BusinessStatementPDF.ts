import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { showToast } from "./ToastService";

/* =========================
   TYPES
========================= */
type Language = "en" | "te";

/* =========================
   TRANSLATIONS
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

    // ✅ NEW
    usersSummary: "Users Summary",
    yourSummary: "Your Summary",
    businessSummary: "Business Summary",
    totalInvestment: "Total Investment",
    totalSold: "Total Sold",
    totalWithdraw: "Total Withdraw",
    availableMoney: "Available Money",
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
    invested: "పెట్టిన మొత్తం",
    investable: "పెట్టాల్సిన మొత్తం",
    sold: "అమ్మకం",
    withdraw: "విత్డ్రా",
    createdBy: "సృష్టించినవారు",

    // ✅ NEW
    usersSummary: "వినియోగదారుల సారాంశం",
    yourSummary: "మీ సారాంశం",

    businessSummary: "వ్యాపార సారాంశం",
    totalInvestment: "మొత్తం పెట్టుబడి",
    totalSold: "మొత్తం అమ్మకం",
    totalWithdraw: "మొత్తం విత్డ్రాల్",
    availableMoney: "మిగిలిన మొత్తం",
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
  investmentDetails,
  language = "en",
  filterType = "allInvestments",
}: {
  businessName: string;
  downloadedBy: string;
  transactions: any[];
  investmentDetails?: any[];
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
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHour = hours % 12 || 12;

  const fileTime = `${formattedHour}-${minutes}-${seconds}-${ampm}`;

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

  const safeInvestmentDetails = Array.isArray(investmentDetails)
    ? investmentDetails
    : [];
  const hasSummary = safeInvestmentDetails.length > 0;
  /* =========================
     ROWS
  ========================= */
  const parse = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  /* =========================
     SUMMARY CALCULATION
  ========================= */
  const calculateSummaryFromInvestment = (data: any[] = []) => {
    let totalInvestment = 0;
    let totalSold = 0;
    let totalWithdraw = 0;
    let totalAvailable = 0;

    const users = data.map((inv) => {
      const invested = parse(inv?.yourInvestment);
      const investable = parse(inv?.actualInvestment);
      const sold = parse(inv?.actualSold);
      const withdraw = parse(inv?.withdrawn);
      const available = parse(inv?.leftOver);

      totalInvestment += invested;
      totalSold += sold;
      totalWithdraw += withdraw;
      totalAvailable += available;

      return {
        name: inv?.partner?.username || "Unknown",
        invested,
        investable,
        sold,
        withdraw,
        available,
      };
    });

    return {
      totalInvestment,
      totalSold,
      totalWithdraw,
      totalAvailable,
      users,
    };
  };

  const summary = calculateSummaryFromInvestment(safeInvestmentDetails);

  /* =========================
     USERS SUMMARY ROWS
  ========================= */
  const userSummaryRows = summary.users
    .map(
      (u) => `
<tr>
  <td>${u.name}</td>
  <td>${formatAmount(u.invested)}</td>
  <td>${formatAmount(u.investable)}</td>
  <td>${formatAmount(u.sold)}</td>
  <td>${formatAmount(u.withdraw)}</td>
  <td>${formatAmount(u.available)}</td>
</tr>`,
    )
    .join("");

  const yourData = summary.users.find(
    (u) =>
      (u.name || "").toLowerCase().trim() ===
      (downloadedBy || "").toLowerCase().trim(),
  );

  /* =========================
     TRANSACTION ROWS
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
  /* =========================
     PAGE SETUP
  ========================= */
  @page {
    size: A4 landscape;
    margin: 40px;
  }

  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }

  /* =========================
     TABLE BASE
  ========================= */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  /* =========================
     HEADER REPEAT FIX (CRITICAL)
  ========================= */
  thead {
    display: table-header-group;
  }

  /* Required for expo-print stability */
  tbody {
    display: table-row-group;
  }

  thead tr {
    page-break-inside: avoid;
  }

  /* =========================
     ROW BREAK FIX (CRITICAL)
  ========================= */
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  td, th {
    page-break-inside: avoid;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  /* =========================
     TABLE STYLING
  ========================= */
  th {
    background: #2563eb;
    color: white;
    text-align: left;
    padding: 6px;
    font-size: 10.5px;
  }

  td {
    border-bottom: 1px solid #e5e7eb;
    padding: 6px;
    font-size: 10.5px;
    vertical-align: top;
  }

  /* =========================
     COLUMN WIDTHS
  ========================= */
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

  /* =========================
     HEADER TEXT
  ========================= */
  .title {
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: #2563eb;
    margin: 10px 0;
  }

  .meta {
    font-size: 11px;
    line-height: 1.6;
    margin-bottom: 10px;
  }

  /* =========================
     FOOTER
  ========================= */
  .footer {
    position: fixed;
    bottom: 10px;
    right: 40px;
    font-size: 10px;
    color: #555;
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

<!-- BUSINESS SUMMARY -->
${
  filterType === "allInvestments" && hasSummary
    ? `
<h3>${t.businessSummary}</h3>
<table>
  <tr>
    <th>${t.totalInvestment}</th>
    <th>${t.totalSold}</th>
    <th>${t.totalWithdraw}</th>
    <th>${t.availableMoney}</th>
  </tr>
  <tr>
    <td>${formatAmount(summary.totalInvestment)}</td>
    <td>${formatAmount(summary.totalSold)}</td>
    <td>${formatAmount(summary.totalWithdraw)}</td>
    <td>${formatAmount(summary.totalAvailable)}</td>
  </tr>
</table>
<br/>
<h3>${t.usersSummary}</h3>
<table>
  <tr>
    <th>${t.user}</th>
    <th>${t.invested}</th>
    <th>${t.investable}</th>
    <th>${t.sold}</th>
    <th>${t.withdraw}</th>
    <th>${t.availableMoney}</th>
  </tr>
  ${userSummaryRows}
</table>

<br/>
`
    : ""
}

<!-- YOUR SUMMARY -->
${
  filterType === "byLoggedInUser" && yourData
    ? `
<h3>${t.yourSummary}</h3>
<table>
  <tr>
    <th>${t.user}</th>
    <th>${t.invested}</th>
    <th>${t.investable}</th>
    <th>${t.sold}</th>
    <th>${t.withdraw}</th>
    <th>${t.availableMoney}</th>
  </tr>
  <tr>
    <td>${yourData.name}</td>
    <td>${formatAmount(yourData.invested)}</td>
    <td>${formatAmount(yourData.investable)}</td>
    <td>${formatAmount(yourData.sold)}</td>
    <td>${formatAmount(yourData.withdraw)}</td>
    <td>${formatAmount(yourData.available)}</td>
  </tr>
</table>

<br/>
`
    : ""
}

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
  const num = Number(value);
  if (value === null || value === undefined || isNaN(num)) return "-";
  return "₹" + num.toLocaleString("en-IN");
};
const formatDate = (value: any) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};
