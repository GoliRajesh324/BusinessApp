import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // Background overlay
  popupBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },

  // Popup container
  popupContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  // Headings
  heading: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 0,
  },

  // Labels
  label: {
    marginTop: 12,
    fontWeight: "500",
  },

  // Inputs / Textarea / Select
  input: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    boxSizing: "border-box",
  },

  // Textarea adjustments
  textarea: {
    height: 80,
    textAlignVertical: "top", // for multiline
  },

  // Buttons container
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  // Buttons
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Small screen adjustments
  smallScreenHeading: {
    fontSize: 18,
  },
  smallScreenInput: {
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  smallScreenButtonText: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
});

export default styles;
    