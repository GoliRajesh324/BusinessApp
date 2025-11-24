import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

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
        body { font-family: Arial; padding: 20px; }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th, td {
          padding: 8px;
          border: 1px solid #ccc;
          word-wrap: break-word;
          text-align: left;
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

        h2, h3 { margin-bottom: 10px; }
      </style>
    </head>

    <body>

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

    // PERSON WISE DETAILS
    Object.keys(grouped).forEach((name) => {
      html += `
        <h3>${name.toUpperCase()}</h3>

        <table>
          <thead>
  <tr>
    <td style="padding:8px; border:1px solid #ccc; background:#1e88e5; color:white; font-weight:bold;">
      Type
    </td>
    <td style="padding:8px; border:1px solid #ccc; background:#1e88e5; color:white; font-weight:bold;">
      Amount
    </td>
    <td style="padding:8px; border:1px solid #ccc; background:#1e88e5; color:white; font-weight:bold;">
      Interest %
    </td>
    <td style="padding:8px; border:1px solid #ccc; background:#1e88e5; color:white; font-weight:bold;">
      Start Date
    </td>
    <td style="padding:8px; border:1px solid #ccc; background:#1e88e5; color:white; font-weight:bold;">
      Comment
    </td>
  </tr>
</thead>

          <tbody>
      `;

      grouped[name].forEach((r) => {
        html += `
          <tr>
            <td>${r.type === "given" ? "Money Taken By You" : "Money Given By You"}</td>
            <td style="text-align:right;">Rs. ${formatAmountIndian(r.amount)}</td>
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

    html += `</body></html>`;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("File Saved", uri);
    }
  } catch (e) {
    console.error(e);
    throw new Error("PDF generation failed");
  }
}
