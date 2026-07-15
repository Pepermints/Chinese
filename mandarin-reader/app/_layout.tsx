import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { initDatabase } from "../src/db/database";
import { theme } from "../src/lib/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((err) => {
        console.error("Failed to init database", err);
        setReady(true); // don't block the app forever on a bad db
      });
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.paper,
        }}
      >
        <ActivityIndicator color={theme.seal} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="texts/index" />
      <Stack.Screen name="texts/add" />
      <Stack.Screen name="texts/[id]" />
      <Stack.Screen name="books/[id]" />
      <Stack.Screen name="books/names" />
      <Stack.Screen name="no-pinyin" />
      <Stack.Screen name="vocabulary" />
    </Stack>
  );
}
