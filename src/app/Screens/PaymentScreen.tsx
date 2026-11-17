import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { peso } from "./../Data/Data";
import { PrimaryButton, Screen, ScreenHeader } from "./../Components/Shared";

const BILL_ROWS = [[5, 10, 20], [50, 100, 500]];

type Props = {
  total: number;
  itemCount: number;
  onBack: () => void;
  onConfirm: (cash: number) => void;
};

export default function CashPaymentScreen({ total, itemCount, onBack, onConfirm }: Props) {
  // how many times each bill was tapped, e.g. { 20: 2, 100: 1 }
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [custom, setCustom] = useState("");
  const [focused, setFocused] = useState(false);

  const bills = Object.entries(counts).reduce((s, [v, n]) => s + Number(v) * n, 0);

  const addBill = (v: number) => setCounts((c) => ({ ...c, [v]: (c[v] ?? 0) + 1 }));
  const removeBill = (v: number) =>
    setCounts((c) => ({ ...c, [v]: Math.max(0, (c[v] ?? 0) - 1) })); // long press = remove one

  const customAmount = parseFloat(custom) || 0;
  const cash = bills + customAmount;
  const change = Math.max(0, cash - total);
  const enough = total > 0 && cash >= total;

  return (
    <Screen bg="bg-[#F6F6F4]">
      <ScreenHeader title="Payment" subtitle="Collect cash from customer" onBack={onBack} />

      <ScrollView className="flex-1" contentContainerClassName="pb-6" keyboardShouldPersistTaps="handled">
        {/* total banner */}
        <View className="items-center bg-[#B3131B] py-6">
          <Text className="text-[10px] font-extrabold tracking-[3px] text-white">TOTAL ORDER</Text>
          <Text className="mt-1 text-5xl font-extrabold text-white">{peso(total)}</Text>
          <Text className="mt-1 text-[11px] text-white/80">
            {itemCount} {itemCount === 1 ? "item" : "items"} in this order
          </Text>
        </View>

        <View className="px-4 pt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-bold text-slate-900">Cash received</Text>
              <Text className="text-[11px] text-slate-500">Tap bills to add · long press to remove one</Text>
            </View>
            <Pressable
              onPress={() => {
                setCounts({});
                setCustom("");
              }}
            >
              <Text className="text-[11px] font-bold tracking-wider text-[#B3131B]">RESET</Text>
            </Pressable>
          </View>

          <View className="mt-3">
            {BILL_ROWS.map((row, r) => (
              <View key={r} className="mb-3 flex-row">
                {[0, 1, 2].map((c) => {
                  const v = row[c];
                  const count = v !== undefined ? counts[v] ?? 0 : 0;
                  const active = count > 0;
                  return (
                    <View key={c} className={`flex-1 ${c < 2 ? "mr-3" : ""}`}>
                      {v !== undefined && (
                        <View>
                          <Pressable
                            onPress={() => addBill(v)}
                            onLongPress={() => removeBill(v)}
                            className={`h-14 flex-row items-center justify-center rounded-2xl border-2 shadow-sm shadow-black/5 ${
                              active ? "border-[#B3131B] bg-[#FDECEC]" : "border-gray-200 bg-white"
                            }`}
                          >
                            <Feather name="plus" size={12} color="#B3131B" />
                            <Text className={`ml-1 text-sm font-bold ${active ? "text-[#B3131B]" : "text-slate-900"}`}>
                              {peso(v)}
                            </Text>
                          </Pressable>

                          {active && (
                            <View
                              pointerEvents="none"
                              className="absolute -right-2 -top-2 min-w-[24px] items-center rounded-full bg-[#B3131B] px-1.5 py-0.5"
                            >
                              <Text className="text-[10px] font-extrabold text-white">{count}x</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <Text className="mt-2 text-xs font-semibold text-slate-800">Custom cash amount</Text>
          <View
            className={`mt-2 h-14 flex-row items-center rounded-2xl border bg-white px-4 ${
              focused ? "border-[#B3131B]" : "border-gray-200"
            }`}
          >
            <Text className="mr-2 text-lg font-bold text-[#B3131B]">₱</Text>
            <TextInput
              value={custom}
              onChangeText={(t) => setCustom(t.replace(/[^0-9.]/g, ""))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              className="flex-1 text-lg text-slate-900"
            />
          </View>

          <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <View className="flex-row items-center justify-between pb-3">
              <Text className="text-[11px] text-slate-500">Cash received</Text>
              <Text className="text-sm font-bold text-slate-900">{peso(cash)}</Text>
            </View>
            <View className="border-t border-dashed border-gray-200 pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-slate-500">Customer change</Text>
                <Text className="text-2xl font-extrabold text-[#B3131B]">{peso(change)}</Text>
              </View>
              {!enough && total > 0 && (
                <Text className="mt-1 text-[9px] font-bold tracking-wider text-amber-700">INSUFFICIENT PAYMENT</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white px-4 pb-4 pt-3">
        <PrimaryButton label="CONFIRM PAYMENT" disabled={!enough} onPress={() => onConfirm(cash)} />
      </View>
    </Screen>
  );
}