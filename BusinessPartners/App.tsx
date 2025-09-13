import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Dashboard from "./app/dashboard";
import BusinessDetail from "./app/BusinessDetail";


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen
          name="BusinessDetail"
          component={BusinessDetail}
          options={{ title: "Business Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
