import React, { useState } from "react";
import styles from "./AddInvestmentPopupStyles";

interface SoldAmount {
  id: number;
  amount: number;
  description: string;
}

interface Props {
  soldAmount: SoldAmount;
  onClose: () => void;
  onSave: (updatedSold: SoldAmount) => void;
}

const EditSoldAmountPopup: React.FC<Props> = ({ soldAmount, onClose, onSave }) => {
  const [amount, setAmount] = useState<number>(soldAmount.amount);
  const [description, setDescription] = useState<string>(soldAmount.description);

  const handleSave = () => {
    onSave({ ...soldAmount, amount, description });
  };

  return (
    <div className="popup-background">
      <div className="popup-container">
        <h2>Edit Sold Amount</h2>
        <label>Amount:</label>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EditSoldAmountPopup;
