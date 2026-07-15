import React from "react";
import { Text, View, Pressable } from "react-native";
import { Link } from "expo-router";
import { BookOpen, Ban, BookMarked } from "lucide-react-native";
import { theme } from "../src/lib/theme";
import { ScreenFrame } from "../src/components/ScreenFrame";

export default function MenuScreen() {
  return (
    <ScreenFrame title="Read Mandarin" showBackButton={false} showBottomNav>
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ color: theme.inkSoft, fontSize: 13, marginTop: 4, marginBottom: 32 }}>
          Read Mandarin, one character at a time
        </Text>

        <Link href="/texts" asChild>
          <NavCard
            icon={<BookOpen size={20} color={theme.seal} />}
            iconBg={theme.sealSoft}
            title="My texts"
            subtitle="Add, edit and read your texts"
          />
        </Link>

        <Link href="/no-pinyin" asChild>
          <NavCard
            icon={<Ban size={20} color={theme.jade} />}
            iconBg={theme.jadeSoft}
            title="Known characters"
            subtitle="Characters that don't need pinyin"
          />
        </Link>

        <Link href="/vocabulary" asChild>
          <NavCard
            icon={<BookMarked size={20} color={theme.ochre} />}
            iconBg={theme.ochreSoft}
            title="Vocabulary"
            subtitle="Words saved while reading"
          />
        </Link>
      </View>
    </ScreenFrame>
  );
}

function NavCard({
  icon,
  iconBg,
  title,
  subtitle,
  ...pressableProps
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      {...pressableProps}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.line,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View>
        <Text style={{ color: theme.ink, fontWeight: "600", fontSize: 16 }}>
          {title}
        </Text>
        <Text style={{ color: theme.inkSoft, fontSize: 12, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
