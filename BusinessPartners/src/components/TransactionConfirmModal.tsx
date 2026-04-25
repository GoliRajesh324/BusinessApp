import { t } from "i18next";
import React, { useRef } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;

  description: string;
  totalAmount: string;
  splitMode: string;
  rows: any[];
  transactionType: "Investment" | "Sold" | "Withdraw";
  supplierName: string | null;
  remaining?: number;
}

const TransactionConfirmModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  description,
  totalAmount,
  splitMode,
  rows,
  transactionType,
  supplierName,
  remaining,
}) => {
  const [verifiedSupplier, setVerifiedSupplier] = React.useState(false);
  const [verifiedPartners, setVerifiedPartners] = React.useState<
    Record<string, boolean>
  >({});
  const [errorMsg, setErrorMsg] = React.useState("");

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setVerifiedSupplier(false);
      setVerifiedPartners({});
      setErrorMsg("");
      setHighlightId(null);
    }
  }, [visible]);

  const allPartnersVerified =
    rows.length > 0 && rows.every((r) => verifiedPartners[r.id]);

  const supplierVerified = supplierName ? verifiedSupplier : true;
  const allVerified = allPartnersVerified && supplierVerified;

  const triggerShake = (id: string) => {
    setHighlightId(id);

    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const scrollToCard = (id: string) => {
    const y = positions.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 80, 0), animated: true });
    triggerShake(id);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t("confirmTransaction")}</Text>

          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
            {/* COMMON */}
            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.label}>{t("transactionType")}</Text>
                  <Text style={styles.value}>{transactionType}</Text>
                </View>
                <View>
                  <Text style={styles.label}>{t("splitType")}</Text>
                  <Text style={styles.value}>{splitMode}</Text>
                </View>
              </View>

              <Text style={styles.label}>{t("description")}</Text>
              <Text style={styles.value}>{description || "-"}</Text>

              <Text style={styles.label}>{t("totalAmount")}</Text>
              <Text style={styles.value}>₹{totalAmount}</Text>
            </View>
            {/* INVESTMENT */}
            {transactionType === "Investment" && (
              <>
                {/* SUPPLIER */}
                {supplierName && (
                  <Animated.View
                    onLayout={(e) =>
                      (positions.current["supplier"] = e.nativeEvent.layout.y)
                    }
                    style={[
                      styles.supplierCard,
                      highlightId === "supplier" && styles.highlightCard,
                      highlightId === "supplier" && {
                        transform: [{ translateX: shakeAnim }],
                      },
                    ]}
                  >
                    <View style={styles.verifyRow}>
                      <Text style={styles.sectionTitle}>
                        {t("supplierDetails")}
                      </Text>

                      <TouchableOpacity
                        disabled={verifiedSupplier}
                        style={[
                          styles.verifyBtn,
                          verifiedSupplier && styles.verifiedBtn,
                        ]}
                        onPress={() => setVerifiedSupplier(true)}
                      >
                        <Text
                          style={[
                            styles.verifyText,
                            verifiedSupplier && { color: "#fff" },
                          ]}
                        >
                          {verifiedSupplier ? "Verified" : "Verify"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>{t("supplierName")}</Text>
                    <Text style={styles.value}>{supplierName}</Text>

                    <Text style={styles.label}>{t("amount")}</Text>
                    <Text style={styles.value}>
                      ₹{(remaining || 0).toFixed(2)}
                    </Text>
                  </Animated.View>
                )}

                {/* PARTNERS */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("partnerDetails")}</Text>

                  {rows.map((r, i) => {
                    const invest = Number(r.investing || 0);
                    const actual = Number(r.actual || 0);
                    const used = Number(r.reduceLeftOver || 0);

                    const outside = actual - used;
                    const pending = invest - actual;

                    const isVerified = verifiedPartners[r.id];

                    return (
                      <Animated.View
                        key={r.id || i}
                        onLayout={(e) =>
                          (positions.current[r.id] = e.nativeEvent.layout.y)
                        }
                        style={[
                          styles.card,
                          highlightId === r.id && styles.highlightCard,
                          highlightId === r.id && {
                            transform: [{ translateX: shakeAnim }],
                          },
                        ]}
                      >
                        <View style={styles.verifyRow}>
                          <Text style={styles.name}>{r.name}</Text>

                          <TouchableOpacity
                            disabled={isVerified}
                            style={[
                              styles.verifyBtn,
                              isVerified && styles.verifiedBtn,
                            ]}
                            onPress={() =>
                              setVerifiedPartners((prev) => ({
                                ...prev,
                                [r.id]: true,
                              }))
                            }
                          >
                            <Text
                              style={[
                                styles.verifyText,
                                isVerified && { color: "#fff" },
                              ]}
                            >
                              {isVerified ? "Verified" : "Verify"}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.text}>
                          {t("investableAmount")}: ₹{invest.toFixed(2)}
                        </Text>

                        <Text style={styles.text}>
                          {t("investedAmount")}: ₹{actual.toFixed(2)}
                        </Text>

                        {pending !== 0 && (
                          <Text
                            style={[
                              styles.text,
                              pending > 0 ? styles.pending : styles.extra,
                            ]}
                          >
                            {pending > 0
                              ? t("pendingAmount")
                              : t("extraAmount")}
                            : ₹{Math.abs(pending).toFixed(2)}
                          </Text>
                        )}

                        {used > 0 && (
                          <View style={styles.highlightBox}>
                            <Text style={styles.highlightLabel}>
                              {t("availableMoneyUsed")}
                            </Text>
                            <Text style={styles.highlightValue}>
                              ₹{used.toFixed(2)}
                            </Text>
                          </View>
                        )}

                        {outside > 0 && (
                          <View
                            style={[styles.highlightBox, styles.outsideBox]}
                          >
                            <Text style={styles.highlightLabel}>
                              {t("newMoneyFromOutside")}
                            </Text>
                            <Text style={styles.highlightValue}>
                              ₹{outside.toFixed(2)}
                            </Text>
                          </View>
                        )}
                      </Animated.View>
                    );
                  })}
                </View>

                {/* VERIFY ALL */}
                <TouchableOpacity
                  disabled={allVerified}
                  style={[
                    styles.verifyAllBtn,
                    allVerified && styles.verifiedBtn,
                  ]}
                  onPress={() => {
                    const all: Record<string, boolean> = {};
                    rows.forEach((r) => (all[r.id] = true));
                    setVerifiedPartners(all);
                    if (supplierName) setVerifiedSupplier(true);
                  }}
                >
                  <Text
                    style={[
                      styles.verifyAllText,
                      allVerified && { color: "#fff" },
                    ]}
                  >
                    {allVerified ? "All Verified" : "Verify All"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {/* 🔥 SOLD */}
            {transactionType === "Sold" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("soldDetails")}</Text>

                {rows.map((r, i) => {
                  const isVerified = verifiedPartners[r.id];

                  return (
                    <Animated.View
                      key={r.id || i}
                      onLayout={(e) =>
                        (positions.current[r.id] = e.nativeEvent.layout.y)
                      }
                      style={[
                        styles.card,
                        highlightId === r.id && styles.highlightCard,
                        highlightId === r.id && {
                          transform: [{ translateX: shakeAnim }],
                        },
                      ]}
                    >
                      <View style={styles.verifyRow}>
                        <Text style={styles.name}>{r.name}</Text>

                        <TouchableOpacity
                          disabled={isVerified}
                          style={[
                            styles.verifyBtn,
                            isVerified && styles.verifiedBtn,
                          ]}
                          onPress={() =>
                            setVerifiedPartners((prev) => ({
                              ...prev,
                              [r.id]: true,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.verifyText,
                              isVerified && { color: "#fff" },
                            ]}
                          >
                            {isVerified ? "Verified" : "Verify"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.text}>
                        {t("soldAmount")}: ₹
                        {Number(r.investing || 0).toFixed(2)}
                      </Text>
                    </Animated.View>
                  );
                })}

                {/* VERIFY ALL */}
                <TouchableOpacity
                  disabled={allVerified}
                  style={[
                    styles.verifyAllBtn,
                    allVerified && styles.verifiedBtn,
                  ]}
                  onPress={() => {
                    const all: Record<string, boolean> = {};
                    rows.forEach((r) => (all[r.id] = true));
                    setVerifiedPartners(all);
                  }}
                >
                  <Text
                    style={[
                      styles.verifyAllText,
                      allVerified && { color: "#fff" },
                    ]}
                  >
                    {allVerified ? "All Verified" : "Verify All"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {/* 🔥 WITHDRAW */}
            {transactionType === "Withdraw" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("withdrawDetails")}</Text>

                {rows.map((r, i) => {
                  const isVerified = verifiedPartners[r.id];

                  return (
                    <Animated.View
                      key={r.id || i}
                      onLayout={(e) =>
                        (positions.current[r.id] = e.nativeEvent.layout.y)
                      }
                      style={[
                        styles.card,
                        highlightId === r.id && styles.highlightCard,
                        highlightId === r.id && {
                          transform: [{ translateX: shakeAnim }],
                        },
                      ]}
                    >
                      <View style={styles.verifyRow}>
                        <Text style={styles.name}>{r.name}</Text>

                        <TouchableOpacity
                          disabled={isVerified}
                          style={[
                            styles.verifyBtn,
                            isVerified && styles.verifiedBtn,
                          ]}
                          onPress={() =>
                            setVerifiedPartners((prev) => ({
                              ...prev,
                              [r.id]: true,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.verifyText,
                              isVerified && { color: "#fff" },
                            ]}
                          >
                            {isVerified ? "Verified" : "Verify"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.text}>
                        {t("withdrawAmount")}: ₹
                        {Number(r.investing || 0).toFixed(2)}
                      </Text>
                    </Animated.View>
                  );
                })}

                {/* VERIFY ALL */}
                <TouchableOpacity
                  disabled={allVerified}
                  style={[
                    styles.verifyAllBtn,
                    allVerified && styles.verifiedBtn,
                  ]}
                  onPress={() => {
                    const all: Record<string, boolean> = {};
                    rows.forEach((r) => (all[r.id] = true));
                    setVerifiedPartners(all);
                  }}
                >
                  <Text
                    style={[
                      styles.verifyAllText,
                      allVerified && { color: "#fff" },
                    ]}
                  >
                    {allVerified ? "All Verified" : "Verify All"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text>{t("cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                if (!allVerified) {
                  setErrorMsg("Please verify all details before confirming");

                  if (supplierName && !verifiedSupplier) {
                    scrollToCard("supplier");
                    return;
                  }

                  const first = rows.find((r) => !verifiedPartners[r.id]);
                  if (first) scrollToCard(first.id);

                  return;
                }

                setErrorMsg("");
                onConfirm();
              }}
            >
              <Text style={styles.confirmText}>{t("confirm")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TransactionConfirmModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: "94%",
    maxHeight: "88%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#111",
  },

  section: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    color: "#222",
  },

  label: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  /* PARTNER CARD */
  card: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f7f9fc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    color: "#222",
  },

  text: {
    fontSize: 13,
    marginTop: 2,
    color: "#333",
  },

  pending: {
    color: "#e53935",
    fontWeight: "600",
  },

  extra: {
    color: "#2e7d32",
    fontWeight: "600",
  },

  /* SUPPLIER CARD */
  supplierCard: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },

  /* HIGHLIGHT (auto-scroll error focus) */
  highlightCard: {
    borderColor: "#ff3b30",
    borderWidth: 2,
    backgroundColor: "#fff5f5",
  },

  /* VERIFY BUTTONS */
  verifyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  verifyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#007bff",
  },

  verifiedBtn: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },

  verifyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007bff",
  },

  /* VERIFY ALL BUTTON */
  verifyAllBtn: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007bff",
  },

  verifyAllText: {
    color: "#007bff",
    fontWeight: "600",
  },

  /* HIGHLIGHT BOXES */
  highlightBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f1f8ff",
    borderWidth: 1,
    borderColor: "#cfe8ff",
  },

  outsideBox: {
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
  },

  highlightLabel: {
    fontSize: 12,
    color: "#555",
  },

  highlightValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },

  /* ERROR */
  errorText: {
    color: "#ff3b30",
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
  },

  /* ACTION BUTTONS */
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    alignItems: "center",
  },

  confirmBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
  },

  confirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
