import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styles from "./AddInvestmentPopupStyles";
import BASE_URL from "../src/config/config";

interface Investment {
  id: number;
  totalAmount: number;
  description: string;
  splitMode: "share" | "amount";
  rows: Array<{ name: string; amount: number }>;
  images: string[];
}

interface Props {
  investment: Investment;
  onClose: () => void;
  onSave: (updatedInvestment: Investment) => void;
}

const EditInvestmentPopup: React.FC<Props> = ({ investment, onClose, onSave }) => {
  const [splitMode, setSplitMode] = useState<"share" | "amount">(investment.splitMode);
  const [totalAmount, setTotalAmount] = useState<number>(investment.totalAmount);
  const [description, setDescription] = useState<string>(investment.description);
  const [rows, setRows] = useState(investment.rows);
  const [uploadedImages, setUploadedImages] = useState<string[]>(investment.images || []);
  const [imageModal, setImageModal] = useState({ open: false, url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token") || "";

  const handleSave = async () => {
    try {
      const updated: Investment = { ...investment, splitMode, totalAmount, description, rows, images: uploadedImages };
      // Optional: send API request
      await axios.put(`${BASE_URL}/investments/${investment.id}`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSave(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="popup-background">
      <div className="popup-container">
        <h2>Edit Investment</h2>
        <label>Total Amount:</label>
        <input
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(Number(e.target.value))}
        />
        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label>Split Mode:</label>
          <select value={splitMode} onChange={(e) => setSplitMode(e.target.value as "share" | "amount")}>
            <option value="share">Share</option>
            <option value="amount">Amount</option>
          </select>
        </div>
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EditInvestmentPopup;
