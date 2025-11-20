// app/interestPerson.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getAllInterests } from "./interestService"; // adjust path if needed

type Interest = {
  id?: number | string;
  name: string;
  type: "given" | "taken";
  amount: number;
  rate?: number;
  startDate?: string;
  endDate?: string | null;
  comment?: string;
};

const formatDate = (d?: string) => {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}-${m}-${y}`;
};
const formatAmt = (a?: number) => a == null ? "" : Number(a).toLocaleString("en-IN");

export default function InterestPerson() {
 const { name } = useLocalSearchParams() as { name?: string };
  const router = useRouter();

  const [records, setRecords] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch();
  }, [name]);

  async function fetch() {
    setLoading(true);
    try {
      const all = await getAllInterests();
      const decoded = name ? decodeURIComponent(name) : "";
      const personRecords = all.filter((r: Interest) => r.name === decoded);
      setRecords(personRecords);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalTaken = records.filter(r => r.type === "given").reduce((s,r) => s + (r.amount||0), 0);
  const totalGiven = records.filter(r => r.type === "taken").reduce((s,r) => s + (r.amount||0), 0);
  const net = totalGiven - totalTaken;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>{name ? decodeURIComponent(name) : "Person"}</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.small}>Net</Text>
        <Text style={styles.net}>₹ {formatAmt(net)}</Text>

        <View style={{height:8}}/>

        <View style={styles.row}>
          <View style={styles.tile}><Text style={styles.tileLabel}>Taken</Text><Text style={styles.tileAmt}>{formatAmt(totalTaken)}</Text></View>
          <View style={styles.tile}><Text style={styles.tileLabel}>Given</Text><Text style={styles.tileAmt}>{formatAmt(totalGiven)}</Text></View>
        </View>
      </View>

      {loading ? <ActivityIndicator style={{marginTop:20}} /> : (
        <ScrollView contentContainerStyle={{padding:14}}>
          {records.map(r => (
            <View key={String(r.id)} style={styles.record}>
              <View style={styles.recordTop}>
                <Text style={{fontWeight:"700"}}>{r.type === "given" ? "Taken" : "Given"}</Text>
                <Text style={{fontWeight:"700"}}>₹ {formatAmt(r.amount)}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text>Interest: {r.rate ?? 0} %</Text>
                <Text>{formatDate(r.startDate)}</Text>
              </View>
              {r.comment ? <Text style={{marginTop:6,color:"#444"}}>{r.comment}</Text> : null}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:"#f4f6f9" },
  header: { flexDirection:"row", alignItems:"center", padding:12 },
  backBtn: { padding:8, marginRight:8 },
  title: { fontSize:20, fontWeight:"700" },
  summary:{ backgroundColor:"#fff", margin:12, padding:12, borderRadius:10, elevation:2 },
  small:{ color:"#666" },
  net:{ fontSize:20, fontWeight:"800", marginTop:6 },
  row:{ flexDirection:"row", gap:8, marginTop:8 },
  tile:{ flex:1, backgroundColor:"#fafafa", padding:10, borderRadius:8, alignItems:"center" },
  tileLabel:{ color:"#666" }, tileAmt:{ fontWeight:"800", marginTop:6 },
  record:{ backgroundColor:"#fff", padding:12, borderRadius:10, marginBottom:10, elevation:1 },
  recordTop:{ flexDirection:"row", justifyContent:"space-between" },
  rowBetween:{ flexDirection:"row", justifyContent:"space-between", marginTop:6 },
});
