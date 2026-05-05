import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export async function generateInterestPDF(
  grouped: Record<string, any[]>,
  totalAmountAll: number,
  totalTakenAll: number,
  totalGivenAll: number,
  formatAmountIndian: (n: number) => string,
  formatDateForDisplay: (d: string) => string,
  personName?: string, // 👈 NEW (optional for individual PDF)
  hideComments: boolean = false,
) {
  try {
    const loggedUser = await AsyncStorage.getItem("userName");
    const safeUser = (loggedUser || "User").replace(/[^a-zA-Z0-9]/g, "_");

    const now = new Date();
    const downloadedOn = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const fileDate = now.toISOString().split("T")[0];
    const fileTime = now.toTimeString().split(" ")[0].replace(/:/g, "-");

    let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
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
        h2, h3 { margin-bottom: 10px; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          page-break-inside: auto;
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th, td {
          padding: 8px;
          border: 1px solid #ccc;
          text-align: left;
          vertical-align: top;
          word-break: break-word;
        }
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

      <div class="pdf-header">
        <div><b>Downloaded By:</b> ${safeUser}</div>
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

    Object.keys(grouped).forEach((name) => {
      html += `
        <h3>${name.toUpperCase()}</h3>
        <table>
        <thead>
  <tr>
    <th style="width:${hideComments ? "25%" : "20%"}">Type</th>
    <th style="width:${hideComments ? "25%" : "15%"}">Amount</th>
    <th style="width:${hideComments ? "20%" : "10%"}">Interest %</th>
    <th style="width:${hideComments ? "30%" : "15%"}">Start Date</th>
    ${!hideComments ? `<th style="width:40%">Comment</th>` : ""}
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
            ${!hideComments ? `<td>${r.comment ?? ""}</td>` : ""}
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

    const result = await Print.printToFileAsync({ html });

    if (!result?.uri) {
      throw new Error("PDF generation failed");
    }

    // ✅ FILE NAMING LOGIC
    let newFileName = `${safeUser.toUpperCase()}_Interest_Summary_${fileDate}_${fileTime}.pdf`;

    if (personName) {
      const safePerson = personName.replace(/[^a-zA-Z0-9]/g, "_");
      newFileName = `${safeUser.toUpperCase()}_${safePerson.toUpperCase()}_Interest_Summary_${fileDate}_${fileTime}.pdf`;
    }

    const originalFile = new File(result.uri);
    const destinationFile = new File(Paths.cache, newFileName);
    originalFile.copy(destinationFile);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(destinationFile.uri, {
        mimeType: "application/pdf",
      });
    } else {
      Alert.alert("File Saved", destinationFile.uri);
    }
  } catch (e) {
    console.log("PDF Error:", e);
    throw new Error("PDF generation failed");
  }
}
