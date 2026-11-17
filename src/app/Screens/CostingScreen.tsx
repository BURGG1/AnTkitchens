// CostingScreen.tsx — costing list + remove menu + add sheet + today's sales (editable after login) & profit
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CostItem, fmtShort, peso } from "./../Data/Data";
import {
  addCostItem,
  clearTodaySales,
  deleteCostItem,
  getCostItems,
  getTodaySalesInfo,
  saveTodaySales,
  setCostQty,
  verifyAdmin,
} from "./../Data/Db";
import { PrimaryButton, QtyStepper, Screen, ScreenHeader } from "./../Components/Shared";

type InputRef = React.ComponentRef<typeof TextInput>;

const cleanAmount = (t: string) => {
  const s = t.replace(/[^0-9.]/g, "");
  const i = s.indexOf(".");
  if (i === -1) return s;
  return s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "").slice(0, 2);
};

function Field({
  label,
  prefix,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  prefix?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  autoFocus?: boolean;
  returnKeyType?: "done" | "next";
  onSubmitEditing?: () => void;
  inputRef?: React.Ref<InputRef>;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences";
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm font-semibold text-slate-800">{label}</Text>
      <View
        className={`min-h-[56px] flex-row items-center rounded-2xl border-2 bg-white px-4 ${
          focused ? "border-[#B3131B]" : "border-gray-300"
        }`}
      >
        {prefix ? <Text className="mr-2 text-lg font-bold text-[#B3131B]">{prefix}</Text> : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={label}
          className="flex-1 py-3 text-lg text-slate-900"
        />

        {/* show / hide password, inside the input */}
        {secureTextEntry ? (
          <Pressable
            onPress={() => setShowPassword((s) => !s)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            className="-mr-2 ml-1 h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Feather name={showPassword ? "eye-off" : "eye"} size={22} color="#4B5563" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AddItemSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, unitCost: number, qty: number) => void;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [qty, setQty] = useState("1");

  const unitCost = parseFloat(cost) || 0;
  const q = parseInt(qty, 10) || 0;
  const valid = name.trim().length > 0 && unitCost > 0 && q >= 1;

  const close = () => {
    setName("");
    setCost("");
    setQty("1");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      {/* "padding" on both platforms; statusBarTranslucent makes Android resize the same way as iOS */}
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={close} accessibilityLabel="Close add costing item" />
        <View className="rounded-t-[32px] bg-white px-5 pb-6 pt-3">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />

          <View className="mb-5 flex-row items-start justify-between">
            <View>
              <Text className="text-xs font-extrabold tracking-[1.5px] text-[#B3131B]">NEW PRODUCT</Text>
              <Text className="text-2xl font-extrabold text-slate-900">Add costing item</Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-12 w-12 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            >
              <Feather name="x" size={22} color="#374151" />
            </Pressable>
          </View>

          <View className="mb-4 flex-row">
            <Field
              label="Product name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pork Shanghai"
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View className="mb-6 flex-row">
            <Field
              label="Unit cost"
              prefix="₱"
              value={cost}
              onChangeText={(t) => setCost(t.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            <View className="w-4" />
            <Field
              label="Quantity"
              value={qty}
              onChangeText={(t) => setQty(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>

          <PrimaryButton
            label="ADD TO COSTING"
            disabled={!valid}
            onPress={() => {
              onAdd(name.trim(), unitCost, q);
              close();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------------- edit total sales (login first) ---------------- */
function SalesEditSheet({
  visible,
  currentSales,
  isManual,
  onClose,
  onSave,
  onClear,
}: {
  visible: boolean;
  currentSales: number;
  isManual: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [step, setStep] = useState<"login" | "amount">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passRef = useRef<InputRef>(null);

  // always start at the login step, with empty fields, every time the sheet opens
  useEffect(() => {
    if (!visible) return;
    setStep("login");
    setUsername("");
    setPassword("");
    setAmount("");
    setError(null);
    setBusy(false);
  }, [visible]);

  const login = async () => {
    if (busy || !username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyAdmin(username, password);
      if (ok) {
        setPassword(""); // don't keep the password in memory longer than needed
        setAmount(currentSales > 0 ? String(currentSales) : "");
        setStep("amount");
      } else {
        setError("Incorrect username or password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const amountNum = parseFloat(amount);
  const amountOk = amount !== "" && amount !== "." && !Number.isNaN(amountNum) && amountNum >= 0;

  const save = async () => {
    if (busy || !amountOk) return;
    setBusy(true);
    try {
      await onSave(amountNum);
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  };

  const clear = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onClear();
      onClose();
    } catch {
      setError("Couldn't reset. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close" />
        <View className="rounded-t-[32px] bg-white px-5 pb-6 pt-3">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />

          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-extrabold tracking-[1.5px] text-[#B3131B]">
                {step === "login" ? "ADMIN ONLY" : "TODAY'S SALES"}
              </Text>
              <Text className="text-2xl font-extrabold text-slate-900">
                {step === "login" ? "Log in to edit sales" : "Enter total sales"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-12 w-12 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            >
              <Feather name="x" size={22} color="#374151" />
            </Pressable>
          </View>

          {step === "login" ? (
            <>
              <View className="mb-4 flex-row">
                <Field
                  label="Username"
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    setError(null);
                  }}
                  placeholder="Username"
                  autoFocus
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                />
              </View>
              <View className="mb-3 flex-row">
                <Field
                  inputRef={passRef}
                  label="Password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError(null);
                  }}
                  placeholder="Password"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={login}
                />
              </View>

              {error ? (
                <View className="mb-3 flex-row items-center rounded-xl bg-[#FEF2F2] px-3 py-2.5">
                  <Feather name="alert-circle" size={18} color="#B91C1C" />
                  <Text className="ml-2 flex-1 text-sm font-semibold text-red-700">{error}</Text>
                </View>
              ) : null}

              <View className="mt-2">
                <PrimaryButton
                  label={busy ? "CHECKING..." : "LOG IN"}
                  icon="lock"
                  iconSide="left"
                  disabled={busy || !username.trim() || !password}
                  onPress={login}
                />
              </View>
            </>
          ) : (
            <>
              <View className="mb-3 flex-row">
                <Field
                  label="Total sales today"
                  prefix="₱"
                  value={amount}
                  onChangeText={(t) => {
                    setAmount(cleanAmount(t));
                    setError(null);
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <Text className="mb-4 text-sm text-slate-600">
                This replaces the total from orders for today ({fmtShort(new Date())}). It also shows in the Sales reports.
              </Text>

              {error ? (
                <View className="mb-3 flex-row items-center rounded-xl bg-[#FEF2F2] px-3 py-2.5">
                  <Feather name="alert-circle" size={18} color="#B91C1C" />
                  <Text className="ml-2 flex-1 text-sm font-semibold text-red-700">{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label={busy ? "SAVING..." : "SAVE TOTAL SALES"}
                disabled={busy || !amountOk}
                onPress={save}
              />

              {isManual ? (
                <Pressable
                  onPress={clear}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Use the automatic total from orders"
                  className="mt-3 min-h-[48px] items-center justify-center rounded-2xl border-2 border-gray-300 bg-white active:bg-gray-100"
                >
                  <Text className="text-sm font-extrabold tracking-wide text-slate-700">USE AUTOMATIC TOTAL FROM ORDERS</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const MENU_W = 168;

export default function CostingScreen({ onBack }: { onBack: () => void }) {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<CostItem[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [salesManual, setSalesManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [salesSheet, setSalesSheet] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // load costing list + today's sales from SQLite
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, sales] = await Promise.all([getCostItems(), getTodaySalesInfo()]);
        if (!alive) return;
        setItems(list);
        setTodaySales(sales.amount);
        setSalesManual(sales.manual);
      } catch (e) {
        console.warn("Failed to load costing data", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const total = items.reduce((s, i) => s + i.unitCost * i.qty, 0);
  const profit = todaySales - total;
  const profitOk = profit >= 0;

  // optimistic UI update, then persist
  const setQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    setCostQty(id, qty).catch((e) => console.warn("Failed to update qty", e));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    deleteCostItem(id).catch((e) => console.warn("Failed to delete item", e));
  };

  // ask first so a mis-tap doesn't delete an item
  const confirmRemove = (id: string) => {
    const name = items.find((i) => i.id === id)?.name ?? "this item";
    Alert.alert("Remove item?", `"${name}" will be removed from your costing list.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeItem(id) },
    ]);
  };

  const addItem = (name: string, unitCost: number, qty: number) => {
    const item: CostItem = { id: `custom-${Date.now()}`, name, unitCost, qty };
    setItems((prev) => [...prev, item]);
    addCostItem(item).catch((e) => console.warn("Failed to add item", e));
  };

  // manual sales: save to SQLite first, then update the screen
  const saveSales = async (amount: number) => {
    await saveTodaySales(amount);
    setTodaySales(amount);
    setSalesManual(true);
  };

  const useAutomaticSales = async () => {
    await clearTodaySales();
    const s = await getTodaySalesInfo();
    setTodaySales(s.amount);
    setSalesManual(s.manual);
  };

  return (
    <Screen bg="bg-[#F6F6F4]">
      <ScreenHeader title="Product costing" subtitle="Track costs and quantities" onBack={onBack} />

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 pt-5" keyboardShouldPersistTaps="handled">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Costing list</Text>
            <Text className="text-sm text-slate-600">{items.length} products</Text>
          </View>
        </View>

        {loading && (
          <View className="mb-3 items-center py-8">
            <ActivityIndicator size="large" color="#B3131B" />
          </View>
        )}

        {!loading && items.length === 0 && (
          <View className="mb-3 items-center rounded-2xl border border-dashed border-gray-400 bg-white px-4 py-8">
            <Text className="text-center text-base text-slate-700">No items yet. Tap “Add items” below to start.</Text>
          </View>
        )}

        {items.map((item, idx) => (
          <View key={item.id} className="mb-3 rounded-2xl bg-white p-4 shadow-sm shadow-black/10">
            {/* top row: number, name, menu */}
            <View className="flex-row items-start">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-[#FDECEC]">
                <Text className="text-sm font-extrabold text-[#B3131B]">{String(idx + 1).padStart(2, "0")}</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold leading-6 text-slate-900">{item.name}</Text>
                <Text className="text-sm text-slate-600">{peso(item.unitCost)} per unit</Text>
              </View>
              <Pressable
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`More options for ${item.name}`}
                onPress={(e) => setMenu({ id: item.id, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
                className="-mr-2 -mt-1 h-12 w-12 items-center justify-center rounded-full active:bg-gray-100"
              >
                <Feather name="more-vertical" size={22} color="#4B5563" />
              </Pressable>
            </View>

            {/* bottom row: quantity + line total */}
            <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
              <View className="flex-row items-center">
                <Text className="mr-3 text-xs font-bold tracking-wide text-slate-600">QTY</Text>
                <QtyStepper qty={item.qty} min={0} onChange={(q) => setQty(item.id, q)} />
              </View>
              <Text className="text-lg font-extrabold text-[#B3131B]">{peso(item.unitCost * item.qty)}</Text>
            </View>
          </View>
        ))}

        {/* total costing */}
        <View className="mt-2 flex-row items-center justify-between overflow-hidden rounded-3xl bg-[#111C2E] p-5">
          <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <View className="flex-1 pr-3">
            <Text className="text-xs font-bold tracking-[1.5px] text-white/80">TOTAL COSTING</Text>
            <Text className="mt-1 text-sm text-white/75">Based on current quantities</Text>
          </View>
          <Text className="text-4xl font-extrabold text-white">{peso(total)}</Text>
        </View>

        {/* today's sales + profit */}
        <View className="mt-3 flex-row">
          {/* tap to edit (asks for login first) */}
          <Pressable
            onPress={() => setSalesSheet(true)}
            accessibilityRole="button"
            accessibilityLabel={`Total sales today, ${peso(todaySales)}${salesManual ? ", entered manually" : ""}`}
            accessibilityHint="Opens a login to edit today's total sales"
            className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Feather name="shopping-bag" size={16} color="#B3131B" />
                <Text className="ml-1.5 text-xs font-bold tracking-wide text-slate-600">TOTAL SALES</Text>
              </View>
              <Feather name="edit-2" size={14} color="#6B7280" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className="mt-2 text-2xl font-extrabold text-slate-900">
              {peso(todaySales)}
            </Text>
            <Text className="text-sm text-slate-600">
              {salesManual ? "Manual · " : "Today · "}
              {fmtShort(new Date())}
            </Text>
          </Pressable>

          <View className="w-3" />

          <View
            accessible
            accessibilityLabel={`Profit, ${profit < 0 ? "minus " : ""}${peso(Math.abs(profit))}`}
            className={`flex-1 rounded-2xl border p-4 ${
              profitOk ? "border-green-200 bg-[#ECFDF3]" : "border-red-200 bg-[#FEF2F2]"
            }`}
          >
            <View className="flex-row items-center">
              <Feather name={profitOk ? "trending-up" : "trending-down"} size={16} color={profitOk ? "#166534" : "#B91C1C"} />
              <Text className="ml-1.5 text-xs font-bold tracking-wide text-slate-600">PROFIT</Text>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              className={`mt-2 text-2xl font-extrabold ${profitOk ? "text-green-800" : "text-red-700"}`}
            >
              {profit < 0 ? "-" : ""}
              {peso(Math.abs(profit))}
            </Text>
            <Text className="text-sm text-slate-600">Sales − total costing</Text>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white px-4 pb-5 pt-3">
        <PrimaryButton label="ADD ITEMS" icon="plus" iconSide="left" onPress={() => setSheet(true)} />
      </View>

      {/* three-dots menu (no text inputs, so no keyboard handling needed) */}
      <Modal visible={menu !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenu(null)}>
        <Pressable className="flex-1" onPress={() => setMenu(null)} accessibilityLabel="Close menu">
          {menu && (
            <View
              style={{
                position: "absolute",
                top: menu.y + 14,
                left: Math.max(12, Math.min(menu.x - MENU_W + 16, width - MENU_W - 12)),
                width: MENU_W,
              }}
              className="rounded-xl bg-[#FDECEC] py-1 shadow-lg shadow-black/20"
            >
              <Pressable
                onPress={() => {
                  const id = menu.id;
                  setMenu(null);
                  confirmRemove(id);
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove item"
                className="min-h-[52px] flex-row items-center px-4 active:bg-red-50"
              >
                <Feather name="trash-2" size={20} color="#DC2626" />
                <Text className="ml-3 text-base font-semibold text-red-600">Remove</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>

      <AddItemSheet visible={sheet} onClose={() => setSheet(false)} onAdd={addItem} />
      <SalesEditSheet
        visible={salesSheet}
        currentSales={todaySales}
        isManual={salesManual}
        onClose={() => setSalesSheet(false)}
        onSave={saveSales}
        onClear={useAutomaticSales}
      />
    </Screen>
  );
}