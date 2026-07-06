import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, House } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../lib/theme";

type ScreenFrameProps = {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  contentContainerStyle?: object;
  contentStyle?: object;
  showBottomNav?: boolean;
};

export function ScreenFrame({
  children,
  title,
  showBackButton = false,
  onBack,
  rightAction,
  contentContainerStyle,
  contentStyle,
  showBottomNav = true,
}: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  const handleBack = onBack ?? (() => router.back());

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 8,
        }}
      >
        {(title || showBackButton || rightAction) && (
          <View style={styles.header}>
            <View style={styles.headerSide}>
              {showBackButton ? (
                <Pressable onPress={handleBack} style={styles.headerButton}>
                  <ArrowLeft size={20} color={theme.ink} />
                </Pressable>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>

            <Text style={styles.title}>{title ?? ""}</Text>

            <View style={styles.headerSide}>
              {rightAction ?? <View style={styles.headerSpacer} />}
            </View>
          </View>
        )}

        <View style={[styles.content, contentStyle, contentContainerStyle]}>
          {children}
        </View>

        {showBottomNav && (
          <View
            style={[
              styles.bottomNav,
              { paddingBottom: Math.max(insets.bottom, 10) },
            ]}
          >
            <Pressable onPress={handleBack} style={styles.navButton}>
              <ArrowLeft size={20} color={theme.ink} />
            </Pressable>
            <Pressable onPress={() => router.replace("/")} style={styles.navButton}>
              <House size={20} color={theme.ink} />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 20,
    height: 20,
  },
  title: {
    color: theme.ink,
    fontWeight: "600",
    fontSize: 17,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingTop: 10,
    paddingHorizontal: 24,
    backgroundColor: theme.paper,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
});
