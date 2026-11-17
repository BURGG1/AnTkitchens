import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";


type CardProps = {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  eyebrow: string;
  title: string;
  sub: string;
  onPress: () => void;
};

function ActionCard({ icon, iconBg, iconColor, eyebrow, title, sub, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 flex-row items-center rounded-3xl bg-white p-4 shadow-md shadow-black/10 active:opacity-90"
    >
      <View className={`h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}>
        <Feather name={icon} size={26} color={iconColor} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-[10px] font-semibold tracking-[1.5px] text-slate-500">{eyebrow}</Text>
        <Text className="text-2xl font-extrabold text-[#B3131B]">{title}</Text>
        <Text className="text-[11px] text-slate-500">{sub}</Text>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#B3131B]">
        <Feather name="arrow-right" size={18} color="#fff" />
      </View>
    </Pressable>
  );
}

export default function HomeScreen({
  onOrder,
  onCosting,
  onSales,
}: {
  onOrder: () => void;
  onCosting: () => void;
  onSales: () => void;
}) {
  return (
    <View className="flex-1 bg-[#FFF4D6]">
      {/* hero */}
      <View className="overflow-hidden rounded-b-[44px] bg-[#B3131B] pb-10">
        <View className="absolute -right-16 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <View className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5" />
        <SafeAreaView edges={["top"]}>
          <View className="px-6 pt-2">
            <View className="flex-row items-center">
              <View className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/30 bg-white">
                <Image
                  source={require("../Resources/logo.png")}
                  className="h-full w-full"
                  resizeMode="cover"
                  accessibilityLabel="A&T Food Products logo"
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xs font-bold tracking-[3px] text-white">FOOD PRODUCTS</Text>
                <Text className="mt-1 text-sm text-white/80">Freshly made, always satisfying</Text>
              </View>
            </View>
            <Text className="mt-8 text-[11px] font-bold tracking-[3px] text-[#F5C542]">WELCOME</Text>
            <Text className="mt-2 max-w-[260px] text-3xl font-extrabold leading-9 text-white">What would you like to do?</Text>
            <Text className="mt-2 text-sm text-white/80">Quick, simple, and made for your business.</Text>

          </View>
        </SafeAreaView>
      </View>

      {/* actions */}
      <View className="flex-1 px-4 pt-6">
        <ActionCard
          icon="shopping-bag"
          iconBg="bg-[#FDECEC]"
          iconColor="#B3131B"
          eyebrow="TAKE AN"
          title="ORDER"
          sub="Start a new customer order"
          onPress={onOrder}
        />
        <ActionCard
          icon="grid"
          iconBg="bg-[#FFF1C7]"
          iconColor="#B3131B"
          eyebrow="VIEW YOUR"
          title="COSTING"
          sub="Manage product costs"
          onPress={onCosting}
        />
        <ActionCard
          icon="bar-chart-2"
          iconBg="bg-[#E6EEFB]"
          iconColor="#1E3A8A"
          eyebrow="TRACK YOUR"
          title="SALES"
          sub="Weekly & monthly reports"
          onPress={onSales}
        />
      </View>

      <SafeAreaView edges={["bottom"]}>
        <Text className="pb-3 text-center text-[10px] tracking-[1.5px] text-[#A8977A]">A&T FOOD PRODUCTS · SINCE 2024</Text>
      </SafeAreaView>
    </View>
  );
}