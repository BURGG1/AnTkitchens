import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

export function Header() {
  return (
    <View className="bg-[#D71920] px-4 pb-4 pt-3 flex-row items-center">
      <View className="h-11 w-11 rounded-xl bg-[#FFF1C7] items-center justify-center">
        <Text className="text-[#D71920] font-extrabold text-sm">A&T</Text>
      </View>
      <View className="ml-3">
        <Text className="text-white font-bold text-sm tracking-wide">A&T FOOD PRODUCTS</Text>
        <Text className="text-white/90 text-xs">Good food. Easy ordering.</Text>
      </View>
    </View>
  );
}

const STEPS = ["Order", "Payment", "Done"];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View className="bg-[#FFF4CC] flex-row justify-around px-4 py-2.5">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <View key={label} className="flex-row items-center">
            <View
              className={`h-5 w-5 rounded-full items-center justify-center ${
                done || active ? "bg-[#D71920]" : "bg-[#D9D3BD]"
              }`}
            >
              <Text className={`text-[10px] font-bold ${done || active ? "text-white" : "text-gray-600"}`}>
                {done ? "✓" : n}
              </Text>
            </View>
            <Text
              className={`ml-1.5 text-xs ${active ? "font-bold text-[#D71920]" : "text-gray-600"}`}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-12 rounded-xl items-center justify-center ${
        disabled ? "bg-[#E5E7EB]" : "bg-[#D71920] active:opacity-80"
      }`}
    >
      <Text className={`text-xs font-bold tracking-wider ${disabled ? "text-gray-400" : "text-white"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-10 w-10 rounded-xl bg-[#F1F1F1] items-center justify-center">
      <Text className="text-lg text-gray-700">←</Text>
    </Pressable>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-[#D71920]" edges={["top"]}>
      <View className="flex-1 bg-white">{children}</View>
    </SafeAreaView>
  );
}