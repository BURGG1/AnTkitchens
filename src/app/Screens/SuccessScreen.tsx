import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { peso } from "./../Data/Data";
import { PrimaryButton, Screen } from "./../Components/Shared";

type Props = {
  total: number;
  cash: number;
  onNewOrder: () => void;
  onHome: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-[11px] text-slate-500">{label}</Text>
      <Text className="text-sm font-bold text-slate-900">{value}</Text>
    </View>
  );
}

export default function OrderSuccessScreen({ total, cash, onNewOrder, onHome }: Props) {
  const change = Math.max(0, cash - total);

  return (
    <Screen bg="bg-[#B3131B]">
      {/* decorative circles */}
      <View className="absolute -right-10 top-24 h-44 w-44 rounded-full border-[18px] border-white/10" />
      <View className="absolute -left-16 bottom-40 h-40 w-40 rounded-full border-[18px] border-white/10" />

      <View className="px-5 pt-2">
        <Text className="text-3xl font-extrabold italic text-white">
          A<Text className="text-[#F5C542]">&</Text>T
        </Text>
        <Text className="text-[8px] font-bold tracking-[2px] text-white">FOOD PRODUCTS</Text>
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-white/15">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#FFF3D0]">
            <Feather name="check" size={36} color="#B3131B" />
          </View>
        </View>

        <Text className="mt-6 text-[10px] font-bold tracking-[3px] text-[#F5C542]">PAYMENT COMPLETE</Text>
        <Text className="mt-2 text-4xl font-extrabold text-white">Order successful!</Text>
        <Text className="mt-3 max-w-[280px] text-center text-xs leading-5 text-white/80">
          The payment has been received and the order is ready to prepare.
        </Text>

        <View className="mt-8 w-full rounded-3xl bg-white p-5 shadow-lg shadow-black/20">
          <View className="flex-row items-center justify-between border-b border-dashed border-gray-200 pb-3">
            <Text className="text-[10px] font-bold tracking-[2px] text-slate-500">PAYMENT SUMMARY</Text>
            <View className="rounded-md bg-[#FDECEC] px-2 py-1">
              <Text className="text-[9px] font-extrabold tracking-wider text-[#B3131B]">CASH</Text>
            </View>
          </View>
          <View className="pt-1">
            <Row label="Order total" value={peso(total)} />
            <Row label="Total paid" value={peso(cash)} />
          </View>
          <View className="mt-1 flex-row items-center justify-between border-t border-gray-200 pt-3">
            <Text className="text-xs font-bold text-slate-900">Customer change</Text>
            <Text className="text-2xl font-extrabold text-[#B3131B]">{peso(change)}</Text>
          </View>
        </View>
      </View>

      <View className="px-5 pb-3">
        <PrimaryButton label="NEW ORDER" variant="cream" icon="shopping-bag" iconSide="left" onPress={onNewOrder} />
        <Pressable onPress={onHome} className="items-center py-3">
          <Text className="text-[11px] font-semibold text-white/90">Back to main menu</Text>
        </Pressable>
      </View>
    </Screen>
  );
}