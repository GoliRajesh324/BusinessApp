import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const getLogoBase64 = async () => {
  const asset = Asset.fromModule(
    require("../../assets/images/BusinessMoneyIcon.png"),
  );

  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error("Logo failed to load");
  }

  const file = new File(asset.localUri);
  return await file.base64();
};

export const generateBusinessStatementPDF = async ({
  businessName,
  downloadedBy,
  transactions,
}: {
  businessName: string;
  downloadedBy: string;
  transactions: any[];
}) => {
  const logoBase64 = await getLogoBase64();

  const now = new Date();
  const formattedNow = now.toLocaleString();
  const fileDate = now.toISOString().split("T")[0];
  const fileTime = now.toTimeString().split(" ")[0].replace(/:/g, "-");

  const groupColorMap = new Map<string | number, string>();
  const colors = ["#ffffff", "#f3f4f6"];
  let colorIndex = 0;

  transactions.forEach((t) => {
    const groupId = t.investmentGroupId ?? "NO_GROUP";
    if (!groupColorMap.has(groupId)) {
      groupColorMap.set(groupId, colors[colorIndex % 2]);
      colorIndex++;
    }
  });

  const rowsHtml = transactions
    .map((t) => {
      const groupId = t.investmentGroupId ?? "NO_GROUP";
      const bgColor = groupColorMap.get(groupId) || "#ffffff";

      return `
<tr style="background:${bgColor};">
  <td>${formatDate(t.createdAt)}</td>
  <td>${t.partnerName || "-"}</td>
  <td>${t.description || "-"}</td>
  <td>${t.transactionType || "-"}</td>
  <td style="text-align:center;">${t.splitType || "-"}</td>
  <td style="text-align:right;">${formatAmount(t.invested)}</td>
  <td style="text-align:right;">${formatAmount(t.investable)}</td>
  <td style="text-align:right;">${formatAmount(t.totalAmount)}</td>
  <td style="text-align:right;">${formatAmount(t.soldAmount)}</td>
  <td style="text-align:right;">${formatAmount(t.withdrawn)}</td>
  <td>${t.createdBy || "-"}</td>
</tr>
`;
    })
    .join("");

  const html = `
<html>
<head>
<style>
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

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  thead {
    display: table-header-group;
  }

  th, td {
    padding: 6px;
    font-size: 10.5px;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  th {
    background: #2563eb;
    color: white;
    text-align: left;
  }

  td {
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }

  /* EXACT 100% COLUMN DISTRIBUTION */

  col.date { width: 8%; }
  col.user { width: 8%; }
  col.desc { width: 18%; }
  col.type { width: 14%; }
  col.split { width: 7%; }

  col.invested { width: 8%; }
  col.investable { width: 8%; }
  col.total { width: 8%; }
  col.sold { width: 8%; }
  col.withdraw { width: 8%; }

  col.created { width: 5%; }

  .header {
    width: 100%;
    margin-bottom: 20px;
  }

  .header-top {
    display: flex;
    justify-content: flex-end;
  }

  .logo {
    height: 24px;
  }

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
  }

  .divider {
    margin-top: 10px;
    height: 1px;
    background: #e5e7eb;
  }

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

<div class="header">
  <div class="header-top">
    <img src="data:image/png;base64,${logoBase64}" class="logo"/>
  </div>

  <div class="title">BizMoney Statement</div>

  <div class="meta">
    <strong>Business:</strong> ${businessName}<br/>
    <strong>Downloaded By:</strong> ${downloadedBy}<br/>
    <strong>Downloaded On:</strong> ${formattedNow}
  </div>

  <div class="divider"></div>
</div>

<h3>Transactions</h3>

<table>
  <colgroup>
    <col class="date">
    <col class="user">
    <col class="desc">
    <col class="type">
    <col class="split">
    <col class="invested">
    <col class="investable">
    <col class="total">
    <col class="sold">
    <col class="withdraw">
    <col class="created">
  </colgroup>

  <thead>
    <tr>
      <th>Date</th>
      <th>User</th>
      <th>Description</th>
      <th>Type</th>
      <th>Split</th>
      <th>Invested</th>
      <th>Investable</th>
      <th>Total</th>
      <th>Sold</th>
      <th>Withdraw</th>
      <th>Created By</th>
    </tr>
  </thead>

  <tbody>
    ${rowsHtml}
  </tbody>
</table>

<div class="footer"></div>

</body>
</html>
`;

  const safeBusinessName = businessName.replace(/[^a-zA-Z0-9]/g, "_");
  const newFileName = `BizMoney_${safeBusinessName}_${fileDate}_${fileTime}.pdf`;

  try {
    const result = await Print.printToFileAsync({ html });

    if (!result?.uri) {
      throw new Error("PDF generation failed");
    }

    const originalFile = new File(result.uri);
    const destinationFile = new File(Paths.cache, newFileName);
    originalFile.copy(destinationFile);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error("Sharing not available on this device");
    }

    await Sharing.shareAsync(destinationFile.uri, {
      mimeType: "application/pdf",
    });
  } catch (error) {
    console.error("PDF Share Error:", error);
  }
};

const formatAmount = (value: any) => {
  if (!value) return "-";
  return "₹" + Number(value).toLocaleString("en-IN");
};

const formatDate = (value: any) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};
