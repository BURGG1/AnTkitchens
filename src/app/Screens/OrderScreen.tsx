// OrderScreen.tsx — menu list (SQLite) + search + add/edit/remove product + order bar
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  GestureResponderEvent,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { Cart, CartLine, PRODUCTS, Product, cartTotals, peso } from "./../Data/Data";
import { addProduct, deleteProduct, getProducts, updateProduct } from "./../Data/Db";
import { PrimaryButton, Screen, ScreenHeader , QtyStepperLarge} from "./../Components/Shared";

type Props = {
  cart: Cart;
  onChange: (id: string, line: CartLine) => void;
  onBack: () => void;
  onNext: () => void;
};

type ProductInput = { name: string; price: number; unit: string; image?: string };
type InputRef = React.ComponentRef<typeof TextInput>;

/* keeps digits and one dot, max 2 decimals */
const cleanPrice = (t: string) => {
  const s = t.replace(/[^0-9.]/g, "");
  const i = s.indexOf(".");
  if (i === -1) return s;
  return s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "").slice(0, 2);
};

/* ---------------- form field ---------------- */
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
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm font-semibold text-slate-800">{label}</Text>
      <View
        className={`min-h-[56px] flex-row items-center rounded-2xl border-2 bg-white px-4 ${focused ? "border-[#B3131B]" : "border-gray-300"
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
          accessibilityLabel={label}
          className="flex-1 py-3 text-lg text-slate-900"
        />
      </View>
    </View>
  );
}

/* ---------------- add / edit product sheet ---------------- */
const UNITS = ["per piece", "per order"] as const;

function ProductSheet({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: Product | null; // null = adding a new product
  onClose: () => void;
  onSave: (p: ProductInput) => void;
}) {
  const { height } = useWindowDimensions();
  const editing = initial !== null;
  const hasVariants = !!initial?.variants;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<string>(UNITS[0]);
  const [image, setImage] = useState<string | undefined>(undefined);

  const priceRef = useRef<InputRef>(null);

  // fill the form each time the sheet opens
  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? "");
    setPrice(initial && !initial.variants ? String(initial.price) : "");
    setUnit(initial?.unit ?? UNITS[0]);
    setImage(initial?.image);
  }, [visible, initial]);

  const units: string[] =
    initial && !(UNITS as readonly string[]).includes(initial.unit) ? [...UNITS, initial.unit] : [...UNITS];

  const priceNum = parseFloat(price) || 0;
  const nameOk = name.trim().length > 0;
  const priceOk = hasVariants || priceNum > 0;
  const valid = nameOk && priceOk;

  const toDataUri = (a: ImagePicker.ImagePickerAsset) =>
    a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri;

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.4, // keeps the saved image small
    base64: true,
  };

  const choosePhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync(options);
      if (!res.canceled && res.assets[0]) setImage(toDataUri(res.assets[0]));
    } catch {
      Alert.alert("Couldn't open gallery", "Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera access needed", "Allow camera access in your phone settings to take a photo.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync(options);
      if (!res.canceled && res.assets[0]) setImage(toDataUri(res.assets[0]));
    } catch {
      Alert.alert("Couldn't open camera", "Please try again.");
    }
  };

  const hint = !nameOk ? "Enter a product name to continue" : !priceOk ? "Enter a price to continue" : null;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {/* "padding" on both platforms; statusBarTranslucent makes Android resize the same way as iOS */}
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close" />
        <View style={{ maxHeight: height * 0.92 }} className="rounded-t-[32px] bg-white px-5 pb-6 pt-3">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-300" />

          <View className="mb-4 flex-row items-start justify-between">
            <View>
              <Text className="text-xs font-extrabold tracking-[1.5px] text-[#B3131B]">
                {editing ? "EDIT PRODUCT" : "NEW PRODUCT"}
              </Text>
              <Text className="text-2xl font-extrabold text-slate-900">{editing ? "Edit product" : "Add to menu"}</Text>
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

          <ScrollView className="flex-shrink" keyboardShouldPersistTaps="handled" bounces={false}>
            {/* photo */}
            <Text className="mb-2 text-sm font-semibold text-slate-800">Photo (optional)</Text>
            <View className="mb-4 flex-row items-center">
              <View className="h-28 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                {image ? (
                  <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" accessibilityLabel="Product photo preview" />
                ) : (
                  <Feather name="image" size={32} color="#6B7280" />
                )}
              </View>
              <View className="ml-4 flex-1">
                <Pressable
                  onPress={choosePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Choose photo from gallery"
                  className="mb-2 min-h-[48px] flex-row items-center justify-center rounded-xl bg-[#FDECEC] px-4 active:bg-[#F9D5D5]"
                >
                  <Feather name="image" size={18} color="#B3131B" />
                  <Text className="ml-2 text-base font-bold text-[#B3131B]">{image ? "Change photo" : "Choose photo"}</Text>
                </Pressable>
                <Pressable
                  onPress={takePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Take a photo with the camera"
                  className="min-h-[48px] flex-row items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-4 active:bg-gray-100"
                >
                  <Feather name="camera" size={18} color="#374151" />
                  <Text className="ml-2 text-base font-bold text-slate-700">Take photo</Text>
                </Pressable>
              </View>
            </View>

            <View className="mb-4 flex-row">
              <Field
                label="Product name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Pork Shanghai"
                autoFocus={!editing}
                returnKeyType={hasVariants ? "done" : "next"}
                onSubmitEditing={() => (hasVariants ? Keyboard.dismiss() : priceRef.current?.focus())}
              />
            </View>
            {hasVariants ? (
              <Text className="mb-4 text-sm text-slate-600">
                This item has fixed price options, so only its name and photo can be edited.
              </Text>
            ) : (
              <View className="mb-4 flex-row">
                <Field
                  inputRef={priceRef}
                  label="Price"
                  prefix="₱"
                  value={price}
                  onChangeText={(t) => setPrice(cleanPrice(t))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            )}

            <Text className="mb-2 text-sm font-semibold text-slate-800">Sold</Text>
            <View className="mb-4 flex-row flex-wrap">
              {units.map((u) => {
                const active = u === unit;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Sold ${u}`}
                    className={`mb-2 mr-3 min-h-[48px] justify-center rounded-xl border-2 px-5 ${active ? "border-[#B3131B] bg-[#B3131B]" : "border-gray-300 bg-white"
                      }`}
                  >
                    <Text className={`text-base font-bold ${active ? "text-white" : "text-slate-700"}`}>{u}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {hint ? <Text className="mb-2 text-center text-sm text-slate-500">{hint}</Text> : null}
          <PrimaryButton
            label={editing ? "SAVE CHANGES" : "ADD TO MENU"}
            disabled={!valid}
            onPress={() => {
              onSave({ name: name.trim(), price: priceNum, unit, image });
              onClose();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------------- product image (fills the full height of the card) ---------------- */
function ProductImage({ uri, name }: { uri: string; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View className="absolute inset-0 items-center justify-center bg-[#F3EDE0]">
        <Feather name="image" size={30} color="#9CA3AF" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      className="absolute inset-0 h-full w-full"
      resizeMode="cover"
      onError={() => setFailed(true)}
      accessibilityLabel={`Photo of ${name}`}
    />
  );
}

/* ---------------- product card ---------------- */
function ProductCard({
  p,
  line,
  onChange,
  onMenu,
}: {
  p: Product;
  line?: CartLine;
  onChange: (l: CartLine) => void;
  onMenu: (e: GestureResponderEvent) => void;
}) {
  const price = line?.price ?? p.variants?.[0] ?? p.price;
  const qty = line?.qty ?? 0;

  return (
    <View
      className={`mb-3 min-h-[148px] flex-row overflow-hidden rounded-3xl bg-white shadow-md shadow-black/10 ${qty > 0 ? "border-2 border-[#B3131B]" : "border-2 border-transparent"
        }`}
    >
      {/* column 1: photo */}
      <View className="w-[110px] self-stretch">
        <ProductImage uri={p.image} name={p.name} />
        {p.badge ? (
          <View className="absolute left-2 top-2 rounded-md bg-[#D4161E] px-2 py-1">
            <Text className="text-[11px] font-extrabold tracking-wide text-white">{p.badge}</Text>
          </View>
        ) : null}
      </View>

      {/* column 2: name, price, quantity + subtotal */}
      <View className="flex-1 justify-between py-3 pl-3 pr-1">
        <View>
          <Text className="text-xl font-bold leading-6 text-slate-900" numberOfLines={2}>
            {p.name}
          </Text>

          {p.variants ? (
            <View className="mt-2 flex-row flex-wrap">
              {p.variants.map((v) => {
                const active = v === price;
                return (
                  <Pressable
                    key={v}
                    onPress={() => onChange({ qty, price: v })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${p.name}, ${peso(v)}`}
                    className={`mb-1 mr-2 min-h-[44px] min-w-[64px] items-center justify-center rounded-xl border-2 px-4 ${active ? "border-[#B3131B] bg-[#B3131B]" : "border-gray-300 bg-white"
                      }`}
                  >
                    <Text className={`text-base font-bold ${active ? "text-white" : "text-slate-700"}`}>{peso(v)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text className="mt-1 text-2xl font-extrabold text-[#B3131B]">{peso(p.price)}</Text>
          )}
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <QtyStepperLarge qty={qty} label={p.name} onChange={(q) => onChange({ qty: q, price })} />

          {qty > 0 ? (
            <View className="ml-2 flex-1 items-end">
              <Text className="text-md text-slate-500">Total:</Text>
              <Text
                className="ml-2 flex-1 text-right text-[#B3131B] text-lg font-extrabold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {peso(qty * price)}
              </Text>
            </View>
          ) : null}

        </View>
      </View>

      {/* column 3: slim strip for the three dots */}
      <View className="w-10 items-center pt-2">
        <Pressable
          onPress={onMenu}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${p.name}`}
          className="h-11 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <Feather name="more-vertical" size={22} color="#4B5563" />
        </Pressable>
      </View>
    </View>
  );
}
/* ---------------- screen ---------------- */
const MENU_W = 168;
const MENU_H = 120;

export default function CreateOrderScreen({ cart, onChange, onBack, onNext }: Props) {
  const { width, height } = useWindowDimensions();
  const { items, total } = cartTotals(cart);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [query, setQuery] = useState("");

  // load the menu from SQLite (built-in items are seeded on first run)
  useEffect(() => {
    let alive = true;
    getProducts()
      .then((list) => alive && setProducts(list))
      .catch((e) => console.warn("Failed to load products", e));
    return () => {
      alive = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products),
    [products, q]
  );
  const showSearch = products.length >= 5;

  const openAdd = () => {
    setEditing(null);
    setSheet(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setSheet(true);
  };

  const saveProduct = (input: ProductInput) => {
    if (editing) {
      const updated: Product = {
        ...editing,
        name: input.name,
        unit: input.unit,
        price: editing.variants ? editing.price : input.price,
        image: input.image ?? editing.image,
      };
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
      updateProduct(updated).catch((e) => console.warn("Failed to update product", e));

      // keep the current order in sync if the price changed
      const line = cart[editing.id];
      if (line && !editing.variants && line.price !== updated.price) {
        onChange(editing.id, { qty: line.qty, price: updated.price });
      }
      return;
    }
    const product: Product = {
      id: `custom-${Date.now()}`,
      name: input.name,
      price: input.price,
      unit: input.unit,
      image: input.image ?? `https://placehold.co/300x360/e7d9c0/333?text=${encodeURIComponent(input.name)}`,
    };
    setProducts((prev) => [...prev, product]);
    addProduct(product).catch((e) => console.warn("Failed to add product", e));
  };

  const removeProduct = (p: Product) => {
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    onChange(p.id, { qty: 0, price: p.price }); // also clear it from the current order
    deleteProduct(p.id).catch((e) => console.warn("Failed to delete product", e));
  };

  // ask first so a mis-tap doesn't delete a product
  const confirmRemove = (p: Product) => {
    Alert.alert("Remove product?", `"${p.name}" will be removed from your menu.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeProduct(p) },
    ]);
  };

  const confirmClear = () => {
    Alert.alert("Clear order?", "All selected items will be removed from this order.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          for (const [id, l] of Object.entries(cart)) {
            if (l.qty > 0) onChange(id, { qty: 0, price: l.price });
          }
        },
      },
    ]);
  };

  const menuProduct = menu ? products.find((p) => p.id === menu.id) ?? null : null;

  return (
    <Screen>
      <ScreenHeader title="Create order" subtitle="Choose items for your customer" onBack={onBack} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="mb-3 flex-row flex-wrap items-center justify-between">
          <View className="mb-1 flex-row items-center">
            <Text className="text-2xl font-bold text-slate-900">Our menu</Text>
            <View className="ml-3 rounded-full bg-gray-200 px-3 py-1">
              <Text className="text-sm font-semibold text-gray-700">
                {q ? `${visible.length} of ${products.length}` : `${products.length} items`}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={openAdd}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Add product to menu"
            className="mb-1 min-h-[48px] flex-row items-center rounded-full bg-[#FDECEC] px-4 active:bg-[#F9D5D5]"
          >
            <Feather name="plus" size={18} color="#B3131B" />
            <Text className="ml-1.5 text-sm font-extrabold tracking-wide text-[#B3131B]">ADD PRODUCT</Text>
          </Pressable>
        </View>

        {showSearch ? (
          <View className="mb-3 h-14 flex-row items-center rounded-2xl border-2 border-gray-200 bg-white px-4">
            <Feather name="search" size={20} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search menu"
              placeholderTextColor="#6B7280"
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search menu"
              className="ml-3 flex-1 py-3 text-base text-slate-900"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Feather name="x" size={16} color="#374151" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {visible.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            line={cart[p.id]}
            onChange={(l) => onChange(p.id, l)}
            onMenu={(e) => setMenu({ id: p.id, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
          />
        ))}

        {products.length === 0 ? (
          <View className="items-center rounded-3xl border-2 border-dashed border-gray-300 bg-white px-6 py-10">
            <Feather name="coffee" size={32} color="#9CA3AF" />
            <Text className="mt-3 text-lg font-bold text-slate-900">Your menu is empty</Text>
            <Text className="mt-1 text-center text-sm text-slate-600">Add your first product to start taking orders.</Text>
          </View>
        ) : null}

        {products.length > 0 && visible.length === 0 ? (
          <View className="items-center rounded-3xl border-2 border-dashed border-gray-300 bg-white px-6 py-10">
            <Feather name="search" size={32} color="#9CA3AF" />
            <Text className="mt-3 text-lg font-bold text-slate-900">No matches</Text>
            <Text className="mt-1 text-center text-sm text-slate-600">{`Nothing found for "${query.trim()}".`}</Text>
            <Pressable
              onPress={() => setQuery("")}
              accessibilityRole="button"
              className="mt-4 min-h-[44px] justify-center rounded-full bg-[#FDECEC] px-5 active:bg-[#F9D5D5]"
            >
              <Text className="text-sm font-extrabold text-[#B3131B]">CLEAR SEARCH</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* order bar */}
      <View className="flex-row items-center rounded-t-3xl bg-white px-5 pb-5 pt-4 shadow-lg shadow-black/20">
        <View accessible accessibilityLabel={`${items} ${items === 1 ? "item" : "items"}, total ${peso(total)}`}>
          <View className="flex-row items-center">
            <Text className="text-sm font-medium text-slate-600">
              {items === 0 ? "No items yet" : `${items} ${items === 1 ? "item" : "items"}`}
            </Text>
            {items > 0 ? (
              <Pressable
                onPress={confirmClear}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Clear order"
                className="ml-3"
              >
                <Text className="text-sm font-bold text-[#B3131B]">Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <Text className="text-3xl font-extrabold text-slate-900">{peso(total)}</Text>
        </View>
        <View className="ml-6 flex-1">
          <PrimaryButton label="NEXT" icon="arrow-right" disabled={items === 0} onPress={onNext} />
        </View>
      </View>

      {/* edit / remove popup (no text inputs, so no keyboard handling needed) */}
      <Modal visible={menu !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenu(null)}>
        <Pressable className="flex-1" onPress={() => setMenu(null)} accessibilityLabel="Close menu">
          {menu && menuProduct ? (
            <View
              style={{
                position: "absolute",
                top: Math.min(menu.y + 14, height - MENU_H - 24),
                left: Math.max(12, Math.min(menu.x - MENU_W + 16, width - MENU_W - 12)),
                width: MENU_W,
              }}
              className="rounded-xl bg-white py-1 shadow-lg shadow-black/20"
            >
              <Pressable
                onPress={() => {
                  setMenu(null);
                  openEdit(menuProduct);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${menuProduct.name}`}
                className="min-h-[52px] flex-row items-center px-4 active:bg-gray-100"
              >
                <Feather name="edit-2" size={20} color="#374151" />
                <Text className="ml-3 text-base font-semibold text-slate-800">Edit</Text>
              </Pressable>
              <View className="mx-3 h-px bg-gray-200" />
              <Pressable
                onPress={() => {
                  setMenu(null);
                  confirmRemove(menuProduct);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${menuProduct.name}`}
                className="min-h-[52px] flex-row items-center px-4 active:bg-red-50"
              >
                <Feather name="trash-2" size={20} color="#DC2626" />
                <Text className="ml-3 text-base font-semibold text-red-600">Remove</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Modal>

      <ProductSheet visible={sheet} initial={editing} onClose={() => setSheet(false)} onSave={saveProduct} />
    </Screen>
  );
}