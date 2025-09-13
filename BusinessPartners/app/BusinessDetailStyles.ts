import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80, // space for header
    paddingHorizontal: 20,
    backgroundColor: "#f9fafb",
  },

  businessNameContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  businessName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#34495e",
  },

  // Summary
  summaryContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    flexDirection: "column",
    gap: 6,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Table wrapper
  tableWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
  },

  // Buttons container
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButton: {
    backgroundColor: "#4f93ff",
  },
  withdrawButton: {
    backgroundColor: "#ff3300",
  },
  soldButton: {
    backgroundColor: "#ff9900",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },

  // Popup overlay
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "90%",
    maxWidth: 360,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    color: "#2c3e50",
  },
  popupButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  popupButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  moveButton: {
    backgroundColor: "#3498db",
  },
  withdrawPopupButton: {
    backgroundColor: "#e74c3c",
  },
  cancelButton: {
    backgroundColor: "#7f8c8d",
  },
  popupButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },

  // Leftover list
  leftoverList: {
    maxHeight: 150,
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  leftoverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  leftoverPartner: {
    fontWeight: "600",
    color: "#2c3e50",
  },
  leftoverAmount: {
    color: "#16a085",
    fontWeight: "500",
  },
});

export default styles;
