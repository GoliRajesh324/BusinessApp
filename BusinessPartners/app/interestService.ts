// InterestService.ts
import BASE_URL from "@/src/config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

type DTO = {
  id?: number | string;
  name: string;
  type: "given" | "taken";
  amount: number;
  rate?: number;
  startDate?: string;
  endDate?: string | null;
  comment?: string;
};

const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : undefined,
      "Content-Type": "application/json",
    };
  } catch (e) {
    console.log("Error getting token from storage", e);
    return { "Content-Type": "application/json" };
  }
};

export const getAllInterests = async (): Promise<DTO[]> => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/api/interest/all/${userId}`, { headers });
    return response.data || [];
  } catch (error) {
    console.log("Error fetching interests:", error);
    return [];
  }
};

export const addInterest = async (dto: DTO): Promise<DTO | null> => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    const headers = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/api/interest/add/${userId}`, dto, { headers });
    return response.data;
  } catch (error) {
    console.log("Error adding interest:", error);
    return null;
  }
};

export const updateInterest = async (id: string | number | null, dto: DTO): Promise<DTO | null> => {
  if (!id) return null;
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${BASE_URL}/api/interest/update/${id}`, dto, { headers });
    return response.data;
  } catch (error) {
    console.log("Error updating interest:", error);
    return null;
  }
};
