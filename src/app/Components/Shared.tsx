// Shared.tsx — shared UI pieces
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export const BRAND = "#B3131B";

export function Screen({ children, bg = "bg-[#F6F6F6]" }: { children: React.ReactNode; bg?: string }) {
  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top", "bottom"]}>
      {children}
    </SafeAreaView>
  );
}

export function LogoBadge() {
  return (
    <View
      className="h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#B3131B]"
      accessible
      accessibilityRole="image"
      accessibilityLabel="A&T logo"
    >
      <Image
        source={require("./../Resources/logo.png")}
        className="h-full w-full"
        resizeMode="cover"
      />
    </View>
  );
}

export function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center bg-white px-4 pb-3 pt-2">
      <Pressable
        onPress={onBack}
        className="h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white active:bg-gray-100"
      >
        <Feather name="arrow-left" size={18} color="#111827" />
      </Pressable>
      <View className="ml-3 flex-1">
        <Text className="text-xl font-bold text-slate-900">{title}</Text>
        <Text className="text-[11px] text-slate-500">{subtitle}</Text>
      </View>
      <LogoBadge />
    </View>
  );
}

type BtnProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "red" | "cream";
  icon?: keyof typeof Feather.glyphMap;
  iconSide?: "left" | "right";
};

export function PrimaryButton({ label, onPress, disabled, variant = "red", icon, iconSide = "right" }: BtnProps) {
  const bg = disabled ? "bg-[#D9D9DD]" : variant === "red" ? "bg-[#B3131B] active:opacity-85" : "bg-[#FFF3D0] active:opacity-85";
  const color = disabled ? "#F5F5F5" : variant === "red" ? "#FFFFFF" : BRAND;
  const iconEl = icon ? <Feather name={icon} size={16} color={color} /> : null;
  return (
    <Pressable onPress={onPress} disabled={disabled} className={`h-14 flex-row items-center justify-center rounded-2xl ${bg}`}>
      {iconSide === "left" && iconEl && <View className="mr-2.5">{iconEl}</View>}
      <Text style={{ color }} className="text-xs font-extrabold tracking-[2px]">
        {label}
      </Text>
      {iconSide === "right" && iconEl && <View className="ml-2.5">{iconEl}</View>}
    </Pressable>
  );
}

/* ---------------- small stepper (costing list, etc.) ---------------- */
export function QtyStepper({ qty, onChange, min = 0 }: { qty: number; onChange: (q: number) => void; min?: number }) {
  const atMin = qty <= min;
  return (
    <View className="flex-row items-center rounded-2xl bg-[#F1F1F2] p-1">
      <Pressable disabled={atMin} onPress={() => onChange(qty - 1)} className="h-7 w-7 items-center justify-center">
        <Feather name="minus" size={20} color={atMin ? "#C4C4C8" : "#374151"} />
      </Pressable>
      <Text className="w-7 text-center text-lg font-bold text-slate-900">{qty}</Text>
      <Pressable onPress={() => onChange(qty + 1)} className="h-7 w-7 items-center justify-center">
        <Feather name="plus" size={20} color={BRAND} />
      </Pressable>
    </View>
  );
}

/* ---------------- large stepper (order screen) ---------------- */
type QtyLargeProps = {
  qty: number;
  onChange: (q: number) => void;
  min?: number;
  max?: number;
  label?: string; // used by screen readers, e.g. the product name
};

/** 48px buttons, 24px quantity text: roughly double the small stepper. */
export function QtyStepperLarge({ qty, onChange, min = 0, max = 99, label = "Quantity" }: QtyLargeProps) {
  const canDec = qty > min;
  const canInc = qty < max;

  return (
    <View className="flex-row items-center" accessibilityRole="adjustable" accessibilityLabel={`${label}, ${qty}`}>
      <Pressable
        onPress={() => canDec && onChange(qty - 1)}
        disabled={!canDec}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        accessibilityState={{ disabled: !canDec }}
        className={`h-12 w-12 items-center justify-center rounded-2xl border-2 ${
          canDec ? "border-[#B3131B] bg-white active:bg-[#FDECEC]" : "border-gray-200 bg-gray-100"
        }`}
      >
        <Feather name="minus" size={28} color={canDec ? "#B3131B" : "#9CA3AF"} />
      </Pressable>

      <Text className="min-w-[44px] text-center text-2xl font-extrabold text-slate-900">{qty}</Text>

      <Pressable
        onPress={() => canInc && onChange(qty + 1)}
        disabled={!canInc}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        accessibilityState={{ disabled: !canInc }}
        className={`h-12 w-12 items-center justify-center rounded-2xl ${
          canInc ? "bg-[#B3131B] active:bg-[#8F0F15]" : "bg-gray-300"
        }`}
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}