import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
    DAY_LONG,
    DAY_SHORT,
    DaySales,
    Week,
    addDays,
    fmtLong,
    fmtRange,
    peso,
    sameDay,
    startOfDay,
    sumDays,
} from "./../Data/Data";
import { getRecentWeeks } from "./../Data/Db";
import { Screen, ScreenHeader } from "./../Components/Shared";

const barWidth = (v: number, max: number) => ({ width: max > 0 && v > 0 ? (`${Math.max(4, (v / max) * 100)}%` as const) : ("0%" as const) });

function Bar({ value, max }: { value: number; max: number }) {
    return (
        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full rounded-full bg-[#D4161E]" style={barWidth(value, max)} />
        </View>
    );
}

function Tabs({ tab, onChange }: { tab: "weekly" | "monthly"; onChange: (t: "weekly" | "monthly") => void }) {
    return (
        <View className="mx-4 mt-4 flex-row rounded-2xl bg-gray-200 p-1">
            {(["weekly", "monthly"] as const).map((t) => {
                const active = tab === t;
                return (
                    <Pressable
                        key={t}
                        onPress={() => onChange(t)}
                        className={`h-11 flex-1 items-center justify-center rounded-xl shadow-sm shadow-black/10 ${active ? "bg-white" : "bg-transparent"
                            }`}
                    >
                        <Text className={`text-[11px] font-extrabold tracking-[1.5px] ${active ? "text-[#B3131B]" : "text-gray-500"}`}>
                            {t === "weekly" ? "WEEKLY SALES" : "MONTHLY SALES"}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function StatRow({ sales, costing, revenue }: { sales: number; costing: number; revenue: number }) {
    const Card = ({ label, value, green }: { label: string; value: number; green?: boolean }) => (
        <View className={`flex-1 rounded-xl border p-3 ${green ? "border-green-200 bg-[#ECFDF3]" : "border-gray-200 bg-white"}`}>
            <Text className="text-[8px] font-bold tracking-wider text-slate-500">{label}</Text>
            <Text className={`mt-1 text-sm font-extrabold ${green ? "text-green-700" : "text-slate-900"}`}>{peso(value)}</Text>
        </View>
    );
    return (
        <View className="mx-4 mt-3 flex-row">
            <Card label="TOTAL SALES" value={sales} />
            <View className="w-2" />
            <Card label="TOTAL COSTING" value={costing} />
            <View className="w-2" />
            <Card label="NET REVENUE" value={revenue} green />
        </View>
    );
}

function DarkHero({ total }: { total: number }) {
    return (
        <View className="mx-4 mt-4 overflow-hidden rounded-3xl bg-[#111C2E] p-5">
            <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
            <View className="absolute right-5 top-5 h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Feather name="bar-chart-2" size={24} color="#F5C542" />
            </View>
            <Text className="text-[10px] font-bold tracking-[2px] text-white/70">LAST 4 WEEKS</Text>
            <Text className="mt-2 text-4xl font-extrabold text-white">{peso(total)}</Text>
            <Text className="mt-1 text-[11px] text-white/60">Tap a week to view daily sales</Text>
        </View>
    );
}

/* ---------------- weekly ---------------- */
function DayCard({ date, d, max }: { date: Date; d: DaySales; max: number }) {
    const today = new Date();
    const isToday = sameDay(date, today);
    const isPast = date < startOfDay(today);
    const status = isToday ? "Today" : isPast && d.sales > 0 ? "Completed" : "No sales yet";
    const net = d.sales - d.costing;
    const dow = (date.getDay() + 6) % 7; // Mon = 0

    return (
        <View className={`mb-3 flex-row rounded-2xl border bg-white p-3.5 ${isToday ? "border-[#F4B9BD]" : "border-transparent"}`}>
            <View className={`h-14 w-14 items-center justify-center rounded-xl ${isToday ? "bg-[#B3131B]" : "bg-gray-100"}`}>
                <Text className={`text-[9px] font-bold ${isToday ? "text-white/80" : "text-slate-500"}`}>{DAY_SHORT[dow]}</Text>
                <Text className={`text-xl font-extrabold ${isToday ? "text-white" : "text-slate-900"}`}>{date.getDate()}</Text>
            </View>
            <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] text-slate-500">{status}</Text>
                    <Text className="text-[11px] font-extrabold text-green-700">{peso(net)} net</Text>
                </View>
                <View className="mt-1 flex-row">
                    <Text className="mr-4 text-[10px] text-slate-500">
                        Sales <Text className="font-bold text-slate-900">{peso(d.sales)}</Text>
                    </Text>
                    <Text className="text-[10px] text-slate-500">
                        Costing <Text className="font-bold text-slate-900">{peso(d.costing)}</Text>
                    </Text>
                </View>
                <Bar value={d.sales} max={max} />
            </View>
        </View>
    );
}

function WeeklyView({ week }: { week: Week }) {
    const t = sumDays(week.days);
    const max = Math.max(...week.days.map((d) => d.sales));
    return (
        <>
            <View className="mx-4 mt-4 overflow-hidden rounded-3xl bg-[#B3131B] p-5">
                <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
                <View className="flex-row items-start justify-between">
                    <Text className="text-[10px] font-bold tracking-[2px] text-white/80">THIS WEEK'S SALES</Text>
                    <View className="rounded-md bg-white/20 px-2 py-1">
                        <Text className="text-[8px] font-extrabold tracking-wider text-white">LIVE</Text>
                    </View>
                </View>
                <Text className="mt-2 text-4xl font-extrabold text-white">{peso(t.sales)}</Text>
                <Text className="mt-1 text-[11px] text-white/80">Monday to Sunday</Text>
            </View>

            <StatRow {...t} />

            <View className="mx-4 mb-3 mt-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-lg font-bold text-slate-900">Daily performance</Text>
                    <Text className="text-[10px] text-slate-500">Sales, costing, and net revenue</Text>
                </View>
                <View className="rounded-full bg-gray-200 px-3 py-1">
                    <Text className="text-[10px] text-gray-600">{fmtRange(week.start)}</Text>
                </View>
            </View>

            <View className="px-4">
                {week.days.map((d, i) => (
                    <DayCard key={i} date={addDays(week.start, i)} d={d} max={max} />
                ))}
            </View>
        </>
    );
}

/* ---------------- monthly ---------------- */
function MonthlyView({ weeks, onPick }: { weeks: Week[]; onPick: (i: number) => void }) {
    const totals = weeks.map((w) => sumDays(w.days));
    const all = totals.reduce((a, t) => ({ sales: a.sales + t.sales, costing: a.costing + t.costing, revenue: a.revenue + t.revenue }), { sales: 0, costing: 0, revenue: 0 });
    const max = Math.max(...totals.map((t) => t.sales));

    return (
        <>
            <DarkHero total={all.sales} />
            <StatRow {...all} />

            <View className="mx-4 mb-3 mt-6">
                <Text className="text-lg font-bold text-slate-900">Sales per week</Text>
                <Text className="text-[10px] text-slate-500">Four-week sales performance</Text>
            </View>

            <View className="px-4">
                {weeks.map((w, i) => (
                    <Pressable
                        key={i}
                        onPress={() => onPick(i)}
                        className="mb-3 flex-row items-center rounded-2xl bg-white p-3.5 active:opacity-90"
                    >
                        <View className="h-16 w-14 items-center justify-center rounded-xl bg-[#FDECEC]">
                            <Text className="text-[8px] font-extrabold tracking-wider text-[#B3131B]">WEEK</Text>
                            <Text className="text-2xl font-extrabold text-[#B3131B]">{i + 1}</Text>
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className="text-[10px] text-slate-500">{fmtRange(w.start)}</Text>
                            <Text className="text-lg font-extrabold text-slate-900">{peso(totals[i].sales)} sales</Text>
                            <Text className="text-[9px] text-slate-500">
                                Costing {peso(totals[i].costing)} · Revenue {peso(totals[i].revenue)}
                            </Text>
                            <Bar value={totals[i].sales} max={max} />
                        </View>
                        <Feather name="chevron-right" size={20} color="#B3131B" />
                    </Pressable>
                ))}
            </View>
        </>
    );
}

/* ---------------- week details ---------------- */
function WeekDetails({ weeks, index, onAll }: { weeks: Week[]; index: number; onAll: () => void }) {
    const w = weeks[index];
    const t = sumDays(w.days);
    const all = weeks.reduce((s, wk) => s + sumDays(wk.days).sales, 0);
    const allCost = weeks.reduce((s, wk) => s + sumDays(wk.days).costing, 0);

    const Col = ({ label, value, color }: { label: string; value: number; color: string }) => (
        <View className="ml-4 w-14 items-start">
            <Text className="text-[7px] font-bold tracking-wider text-slate-400">{label}</Text>
            <Text className={`text-[11px] font-extrabold ${color}`}>{peso(value)}</Text>
        </View>
    );

    return (
        <>
            <DarkHero total={all} />
            <StatRow sales={all} costing={allCost} revenue={all - allCost} />

            <View className="mx-4 mb-3 mt-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-lg font-bold text-slate-900">Week {index + 1} details</Text>
                    <Text className="text-[10px] text-slate-500">Daily sales for the selected week</Text>
                </View>
                <Pressable onPress={onAll} className="rounded-full bg-[#FDECEC] px-3 py-1.5">
                    <Text className="text-[9px] font-extrabold tracking-wider text-[#B3131B]">ALL WEEKS</Text>
                </Pressable>
            </View>

            <View className="mx-4 overflow-hidden rounded-2xl bg-white">
                {w.days.map((d, i) => {
                    const date = addDays(w.start, i);
                    return (
                        <View key={i} className="flex-row items-center border-b border-gray-100 px-4 py-4">
                            <View className="flex-1">
                                <Text className="text-sm font-bold text-slate-900">{DAY_LONG[i]}</Text>
                                <Text className="text-[10px] text-slate-500">{fmtLong(date)}</Text>
                            </View>
                            <Col label="SALES" value={d.sales} color="text-slate-900" />
                            <Col label="COSTING" value={d.costing} color="text-[#B3131B]" />
                            <Col label="REVENUE" value={d.sales - d.costing} color="text-green-700" />
                        </View>
                    );
                })}
                <View className="flex-row justify-between bg-[#FFF4D6] px-4 py-3.5">
                    {[
                        ["WEEK " + (index + 1) + " SALES", t.sales, "text-[#B3131B]"],
                        ["TOTAL COSTING", t.costing, "text-slate-900"],
                        ["NET REVENUE", t.revenue, "text-green-700"],
                    ].map(([label, v, c]) => (
                        <View key={label as string}>
                            <Text className="text-[7px] font-bold tracking-wider text-slate-500">{label}</Text>
                            <Text className={`text-sm font-extrabold ${c}`}>{peso(v as number)}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </>
    );
}

/* ---------------- screen ---------------- */
export default function SalesScreen({ onBack }: { onBack: () => void }) {
    const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
    const [picked, setPicked] = useState<number | null>(null);
    const [weeks, setWeeks] = useState<Week[] | null>(null);

    // index 0 = current week, then the 3 previous weeks
    useEffect(() => {
        let alive = true;
        getRecentWeeks(4)
            .then((w) => alive && setWeeks(w))
            .catch((e) => console.warn("Failed to load sales", e));
        return () => {
            alive = false;
        };
    }, []);

    const goBack = () => (tab === "monthly" && picked !== null ? setPicked(null) : onBack());

    return (
        <Screen bg="bg-[#F6F6F6]">
            <ScreenHeader title="Sales reports" subtitle="Monitor your business performance" onBack={goBack} />
            <Tabs
                tab={tab}
                onChange={(t) => {
                    setTab(t);
                    setPicked(null);
                }}
            />
            <ScrollView className="flex-1" contentContainerClassName="pb-8">
                {!weeks ? (
                    <View className="items-center py-16">
                        <ActivityIndicator color="#B3131B" />
                    </View>
                ) : tab === "weekly" ? (
                    <WeeklyView week={weeks[0]} />
                ) : picked === null ? (
                    <MonthlyView weeks={weeks} onPick={setPicked} />
                ) : (
                    <WeekDetails weeks={weeks} index={picked} onAll={() => setPicked(null)} />
                )}
            </ScrollView>
        </Screen>
    );
}