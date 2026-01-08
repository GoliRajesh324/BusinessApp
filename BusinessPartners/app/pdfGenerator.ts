import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

const downloadedOn = new Date().toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function generateInterestPDF(
  grouped: Record<string, any[]>,
  totalAmountAll: number,
  totalTakenAll: number,
  totalGivenAll: number,
  formatAmountIndian: (n: number) => string,
  formatDateForDisplay: (d: string) => string
) {
  try {
    let html = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial;
          padding: 20px;
        }

        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #1e88e5;
          padding-bottom: 8px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #444;
        }

        h2, h3 {
          margin-bottom: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          page-break-inside: auto;
        }

        thead {
          display: table-header-group;
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        th, td {
          padding: 8px;
          border: 1px solid #ccc;
          text-align: left;
          vertical-align: top;
          word-break: break-word;
          white-space: pre-wrap;
        }

        /* iOS ignores background on <tr>, so put on <th> */
        th {
          background: #1e88e5 !important;
          color: white !important;
        }

        .summary-table td {
          padding: 8px;
          border: 1px solid #ccc;
        }
      </style>
    </head>

    <body>

      <!-- HEADER -->
      <div class="pdf-header">
        <div><b>Downloaded By:</b> </div>
        <div><b>Downloaded On:</b> ${downloadedOn}</div>
      </div>

      <h2>Interest Money Details</h2>

      <table class="summary-table" style="margin-bottom:25px;">
        <tr>
          <td><b>Your Remaining Money</b></td>
          <td style="text-align:right;">₹ ${formatAmountIndian(totalAmountAll)}</td>
        </tr>
        <tr>
          <td><b>Money Taken By You</b></td>
          <td style="text-align:right; color:red;">₹ ${formatAmountIndian(totalTakenAll)}</td>
        </tr>
        <tr>
          <td><b>Money Given By You</b></td>
          <td style="text-align:right; color:green;">₹ ${formatAmountIndian(totalGivenAll)}</td>
        </tr>
      </table>
    `;

    // CONTINUOUS PERSON-WISE DETAILS
    Object.keys(grouped).forEach((name) => {
      html += `
        <h3>${name.toUpperCase()}</h3>

        <table>
          <thead>
  <tr>
              <th style="width:20%">Type</th>
              <th style="width:15%">Amount</th>
              <th style="width:10%">Interest %</th>
              <th style="width:15%">Start Date</th>
              <th style="width:40%">Comment</th>
  </tr>
</thead>

          <tbody>
      `;

      grouped[name].forEach((r) => {
        html += `
          <tr>
            <td>${r.type === "given" ? "Money Taken By You" : "Money Given By You"}</td>
            <td style="text-align:right;">₹ ${formatAmountIndian(r.amount)}</td>
            <td style="text-align:center;">${r.rate ?? 0} %</td>
            <td style="text-align:center;">${formatDateForDisplay(r.startDate)}</td>
            <td>${r.comment ?? ""}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
        <br/>
      `;
    });

    html += `
    </body>
    </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("File Saved", uri);
    }
  } catch (e) {
    console.log("PDF Error:", e);
    throw new Error("PDF generation failed");
  }
}
