"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Wallet, Settings,
  X, Check, Sun, Moon, Flame, Trash2, Banknote, Smartphone, Receipt, Users,
} from "lucide-react";

/* ---------- Constants & helpers ---------- */
const FIRST_HOUR = 6;
const LAST_HOUR = 23;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const CURRENCY = "৳";

const DEFAULT_CONFIG = {
  baseRate: 1000,
  peakStartHour: 18,
  peakMultiplier: 1.3,
  weekendMultiplier: 1.2,
};

const cn = (...a: any[]) => a.filter(Boolean).join(" ");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (k: string) => new Date(`${k}T00:00:00`);
const addDays = (k: string, n: number) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d); };
const fmtHour = (h: number) => `${String(h % 12 || 12).padStart(2, "0")}:00 ${h % 24 < 12 ? "AM" : "PM"}`;
const money = (n: number) => `${CURRENCY}${Math.round(n).toLocaleString("en-US")}`;
const isWeekend = (k: string) => [5, 6].includes(fromKey(k).getDay());
const slotId = (dateKey: string, hour: number) => `${dateKey}|${hour}`;

const calcRate = (cfg: any, dateKey: string, hour: number) => {
  let rate = Number(cfg.baseRate) || 0;
  if (hour >= cfg.peakStartHour) rate *= Number(cfg.peakMultiplier) || 1;
  if (isWeekend(dateKey)) rate *= Number(cfg.weekendMultiplier) || 1;
  return Math.round(rate);
};

const buildMockBookings = () => {
  const t = toKey(new Date());
  const tm = addDays(t, 1);
  const mk = (d: string, h: number, name: string, phone: string, method: string, total: number, paid: number, source: string) => [
    slotId(d, h), { name, phone, method, total, paid, source },
  ];
  return Object.fromEntries([
    mk(t, 17, "Rahim Uddin", "01711000111", "bKash", 1000, 1000, "customer"),
    mk(t, 19, "Karim Hossain", "01819222333", "Advance", 1300, 500, "customer"),
    mk(t, 20, "Team Sharks FC", "01611666777", "Cash", 1300, 1300, "staff"),
    mk(tm, 18, "Sabbir Ahmed", "01912444555", "Advance", 1300, 400, "customer"),
    mk(tm, 21, "Walk-in Player", "", "Cash", 1300, 0, "staff"),
  ]);
};

/* ---------- Small UI pieces ---------- */
const Field = ({ label, icon: Icon, children }: any) => (
  <label className="block text-xs font-medium text-slate-400">
    <span className="mb-1 flex items-center gap-1.5">{Icon && <Icon size={13} />}{label}</span>
    {children}
  </label>
);
const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500";

const Line = ({ label, value, strong, tone }: any) => (
  <div className={cn("flex justify-between py-1 text-sm", strong && "text-base font-semibold", tone)}>
    <span className="opacity-70">{label}</span><span>{value}</span>
  </div>
);

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Booking form modal ---------- */
function BookingModal({ staff, dateKey, hour, rate, onClose, onConfirm }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState(staff ? "Cash" : "bKash");
  const [advance, setAdvance] = useState(Math.round(rate * 0.3));
  const [staffPaid, setStaffPaid] = useState(rate);
  const [error, setError] = useState("");

  const paid = staff
    ? Math.min(rate, Math.max(0, Number(staffPaid) || 0))
    : method === "bKash" ? rate
    : method === "Advance" ? Math.min(rate, Math.max(0, Number(advance) || 0))
    : 0;

  const submit = () => {
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const phoneOk = /^\+?\d{10,14}$/.test(cleanPhone);
    if (!staff && name.trim().length < 2) return setError("Please enter the customer name.");
    if (!staff && !phoneOk) return setError("Enter a valid phone number (10–14 digits).");
    if (staff && cleanPhone && !phoneOk) return setError("Phone number looks invalid.");
    if (!staff && method === "Advance" && paid <= 0) return setError("Enter an advance amount greater than 0.");
    onConfirm({
      name: name.trim() || "Walk-in Player",
      phone: cleanPhone,
      method,
      total: rate,
      paid,
      source: staff ? "staff" : "customer",
    });
  };

  const methods = [
    { id: "Cash", icon: Banknote },
    { id: "bKash", icon: Smartphone },
    { id: "Advance", icon: Wallet },
  ];

  return (
    <Modal title={staff ? "Walk-in Booking" : "Book This Slot"} onClose={onClose}>
      <div className="mb-4 rounded-lg bg-slate-900 p-3 text-sm">
        <div className="font-medium text-emerald-400">{fromKey(dateKey).toDateString()}</div>
        <div className="mt-1 flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5"><Clock size={14} />{fmtHour(hour)} – {fmtHour(hour + 1)}</span>
          <span className="font-semibold text-white">{money(rate)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Field label={staff ? "Name (optional)" : "Customer Name"} icon={User}>
          <input className={inputCls} value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Rahim Uddin" />
        </Field>
        <Field label={staff ? "Phone (optional)" : "Phone Number"} icon={Phone}>
          <input className={inputCls} inputMode="tel" value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
        </Field>

        <div>
          <div className="mb-1 text-xs font-medium text-slate-400">Payment Type</div>
          <div className="grid grid-cols-3 gap-2">
            {methods.map(({ id, icon: Icon }) => (
              <button
                key={id} type="button" onClick={() => setMethod(id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition",
                  method === id
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                    : "border-slate-700 text-slate-300 hover:border-slate-500"
                )}
              >
                <Icon size={14} />{id}
              </button>
            ))}
          </div>
        </div>

        {staff ? (
          <div>
            <Field label={`Amount received (${CURRENCY})`} icon={Wallet}>
              <input type="number" min="0" max={rate} className={inputCls} value={staffPaid}
                onChange={(e: any) => setStaffPaid(e.target.value)} />
            </Field>
            <div className="mt-2 flex gap-2">
              {[["Full", rate], ["Half", Math.round(rate / 2)], ["None", 0]].map(([l, v]: any) => (
                <button key={l} type="button" onClick={() => setStaffPaid(v)}
                  className="flex-1 rounded-md bg-slate-700 py-1.5 text-xs hover:bg-slate-600">{l}</button>
              ))}
            </div>
          </div>
        ) : method === "Advance" ? (
          <Field label={`Advance amount (${CURRENCY})`} icon={Wallet}>
            <input type="number" min="0" max={rate} className={inputCls} value={advance}
              onChange={(e: any) => setAdvance(e.target.value)} />
          </Field>
        ) : method === "Cash" ? (
          <p className="text-xs text-slate-400">Cash: pay at the turf counter before your slot starts.</p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-slate-700 pt-3">
        <Line label="Total" value={money(rate)} />
        <Line label="Paid now" value={money(paid)} tone="text-emerald-400" />
        <Line label="Remaining due" value={money(rate - paid)} strong tone={rate - paid > 0 ? "text-amber-400" : "text-emerald-400"} />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button onClick={submit} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
        <Check size={18} />Confirm Booking
      </button>
    </Modal>
  );
}

/* ---------- Staff: booking details modal ---------- */
function DetailsModal({ dateKey, hour, booking, onClose, onCollect, onCancel }: any) {
  const due = booking.total - booking.paid;
  const [amount, setAmount] = useState(due);
  const pay = Math.min(due, Math.max(0, Number(amount) || 0));
  return (
    <Modal title="Booking Details" onClose={onClose}>
      <div className="mb-3 rounded-lg bg-slate-900 p-3 text-sm">
        <div className="font-medium text-emerald-400">{fromKey(dateKey).toDateString()}</div>
        <div className="flex items-center gap-1.5 text-slate-300"><Clock size={14} />{fmtHour(hour)} – {fmtHour(hour + 1)}</div>
      </div>
      <Line label="Customer" value={booking.name} />
      <Line label="Phone" value={booking.phone || "—"} />
      <Line label="Payment type" value={booking.method} />
      <Line label="Booked by" value={booking.source === "staff" ? "Staff (walk-in)" : "Online customer"} />
      <div className="my-2 border-t border-slate-700" />
      <Line label="Total" value={money(booking.total)} />
      <Line label="Paid" value={money(booking.paid)} tone="text-emerald-400" />
      <Line label="Due" value={money(due)} strong tone={due > 0 ? "text-amber-400" : "text-emerald-400"} />

      {due > 0 && (
        <div className="mt-3 rounded-lg bg-slate-900 p-3">
          <Field label={`Collect payment (${CURRENCY})`} icon={Wallet}>
            <input type="number" min="0" max={due} className={inputCls} value={amount} onChange={(e: any) => setAmount(e.target.value)} />
          </Field>
          <button onClick={() => onCollect(pay)} disabled={pay <= 0}
            className="mt-2 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40">
            Receive {money(pay)}
          </button>
        </div>
      )}
      <button onClick={onCancel}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/15 py-2 text-sm text-red-300 hover:bg-red-500/25">
        <Trash2 size={15} />Cancel Booking
      </button>
    </Modal>
  );
}

/* ---------- Main dashboard ---------- */
export default function TurfDashboard() {
  const todayKey = toKey(new Date());
  const [staffMode, setStaffMode] = useState(false);
  const [dateKey, setDateKey] = useState(todayKey);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [bookings, setBookings] = useState(buildMockBookings);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [detailHour, setDetailHour] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const nowHour = new Date().getHours();
  const isPast = (h: number) => dateKey < todayKey || (dateKey === todayKey && h <= nowHour);
  const weekend = isWeekend(dateKey);

  const dayBookings = useMemo(
    () => HOURS.map((h) => bookings[slotId(dateKey, h)]).filter(Boolean),
    [bookings, dateKey]
  );
  const collected = dayBookings.reduce((s: number, b: any) => s + b.paid, 0);
  const outstanding = dayBookings.reduce((s: number, b: any) => s + (b.total - b.paid), 0);

  const switchMode = (staff: boolean) => { setStaffMode(staff); setSelectedHour(null); setDetailHour(null); };

  const onSlotClick = (h: number) => {
    const booking = bookings[slotId(dateKey, h)];
    if (booking) {
      if (staffMode) setDetailHour(h);
      else flash("That slot is already booked.");
      return;
    }
    if (isPast(h)) return flash("That time has already passed.");
    setSelectedHour(h);
  };

  const confirmBooking = (data: any) => {
    if (selectedHour === null) return;
    const id = slotId(dateKey, selectedHour);
    if (bookings[id]) {
      setSelectedHour(null);
      return flash("Slot was just taken. Please choose another.");
    }
    setBookings((prev: any) => (prev[id] ? prev : { ...prev, [id]: data }));
    setSelectedHour(null);
    flash("Booking confirmed!");
  };

  const collectPayment = (amt: number) => {
    if (detailHour === null) return;
    const id = slotId(dateKey, detailHour);
    setBookings((prev: any) => ({ ...prev, [id]: { ...prev[id], paid: prev[id].paid + amt } }));
    setDetailHour(null);
    flash(`Received ${money(amt)}.`);
  };

  const cancelBooking = () => {
    if (detailHour === null) return;
    const id = slotId(dateKey, detailHour);
    setBookings((prev: any) => { const n = { ...prev }; delete n[id]; return n; });
    setDetailHour(null);
    flash("Booking cancelled.");
  };

  const setCfg = (key: string) => (e: any) => setConfig((c: any) => ({ ...c, [key]: Number(e.target.value) || 0 }));

  const slotStyle = (h: number, booked: boolean) => {
    if (booked) return { card: "border-red-500/40 bg-red-500/10", tag: "bg-red-500/20 text-red-300", label: "Booked" };
    if (selectedHour === h) return { card: "border-blue-500 bg-blue-500/15 ring-1 ring-blue-500", tag: "bg-blue-500/25 text-blue-300", label: "Selected" };
    if (isPast(h)) return { card: "border-slate-800 bg-slate-800/40 opacity-50", tag: "bg-slate-700 text-slate-400", label: "Past" };
    return { card: "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/15", tag: "bg-emerald-500/20 text-emerald-300", label: "Available" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="font-bold leading-tight text-white">GreenKick Turf</div>
            <div className="text-xs text-emerald-400">Booking &amp; Slot Management</div>
          </div>
          <div className="flex rounded-full bg-slate-800 p-1 text-sm">
            {([[false, "Customer View", Users], [true, "Staff / Management", Settings]] as const).map(([v, label, Icon]) => (
              <button key={label} onClick={() => switchMode(v)}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 transition",
                  staffMode === v ? "bg-emerald-500 font-semibold text-slate-950" : "text-slate-300")}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setDateKey(addDays(dateKey, -1))} className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700" aria-label="Previous day"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5">
              <Calendar size={16} className="text-emerald-400" />
              <input type="date" value={dateKey} min={staffMode ? undefined : todayKey}
                onChange={(e) => e.target.value && setDateKey(e.target.value)}
                className="bg-transparent text-sm outline-none [color-scheme:dark]" />
            </div>
            <button onClick={() => setDateKey(addDays(dateKey, 1))} className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700" aria-label="Next day"><ChevronRight size={18} /></button>
            <button onClick={() => setDateKey(todayKey)} className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">Today</button>
            <span className={cn("ml-auto rounded-full px-2.5 py-1 text-xs",
              weekend ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-300")}>
              {weekend ? `Weekend rate ×${config.weekendMultiplier}` : "Weekday rate"}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Sun size={13} className="text-amber-300" />Day rate</span>
            <span className="flex items-center gap-1"><Moon size={13} className="text-indigo-300" />Evening / night from {fmtHour(config.peakStartHour)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {HOURS.map((h) => {
              const booking = bookings[slotId(dateKey, h)];
              const st = slotStyle(h, !!booking);
              const peak = h >= config.peakStartHour;
              return (
                <button key={h} onClick={() => onSlotClick(h)}
                  className={cn("rounded-xl border p-3 text-left transition", st.card)}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-white">{fmtHour(h)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", st.tag)}>{st.label}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    {peak ? <Flame size={12} className="text-orange-400" /> : <Sun size={12} className="text-amber-300" />}
                    to {fmtHour(h + 1)}
                  </div>
                  <div className="mt-2 text-lg font-bold text-emerald-300">{money(calcRate(config, dateKey, h))}</div>
                  {staffMode && booking && (
                    <div className="mt-1.5 space-y-0.5 border-t border-red-500/20 pt-1.5 text-xs text-red-200">
                      <div className="flex items-center gap-1 truncate"><User size={11} />{booking.name}</div>
                      <div className="flex items-center gap-1 truncate"><Phone size={11} />{booking.phone || "No phone"}</div>
                      <div className={cn("font-medium", booking.total > booking.paid ? "text-amber-300" : "text-emerald-300")}>
                        {booking.total > booking.paid ? `Due ${money(booking.total - booking.paid)}` : "Paid in full"}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          {!staffMode && (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
              <h2 className="mb-2 font-semibold text-white">Rates for this date</h2>
              <Line label="Standard hours" value={money(calcRate(config, dateKey, FIRST_HOUR))} />
              <Line label={`From ${fmtHour(config.peakStartHour)}`} value={money(calcRate(config, dateKey, config.peakStartHour))} />
              <p className="mt-2 text-xs text-slate-400">Tap a green slot to book it.</p>
            </div>
          )}

          {staffMode && (
            <>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                <h2 className="mb-2 flex items-center gap-2 font-semibold text-white"><Receipt size={16} />Day Summary</h2>
                <Line label="Slots booked" value={`${dayBookings.length} / ${HOURS.length}`} />
                <Line label="Collected" value={money(collected)} tone="text-emerald-400" />
                <Line label="Outstanding due" value={money(outstanding)} tone={outstanding > 0 ? "text-amber-400" : ""} />
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-white"><Settings size={16} />Pricing Settings</h2>
                <div className="space-y-3">
                  <Field label={`Base hourly rate (${CURRENCY})`}>
                    <input type="number" min="0" step="50" className={inputCls} value={config.baseRate} onChange={setCfg("baseRate")} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Peak starts (hour, 0–23)">
                      <input type="number" min="0" max="23" className={inputCls} value={config.peakStartHour} onChange={setCfg("peakStartHour")} />
                    </Field>
                    <Field label="Peak multiplier">
                      <input type="number" min="1" step="0.05" className={inputCls} value={config.peakMultiplier} onChange={setCfg("peakMultiplier")} />
                    </Field>
                  </div>
                  <Field label="Weekend (Fri/Sat) multiplier">
                    <input type="number" min="1" step="0.05" className={inputCls} value={config.weekendMultiplier} onChange={setCfg("weekendMultiplier")} />
                  </Field>
                  <button onClick={() => setConfig(DEFAULT_CONFIG)} className="w-full rounded-lg bg-slate-700 py-2 text-xs hover:bg-slate-600">Reset to defaults</button>
                  <p className="text-xs text-slate-500">Updates all open slots instantly. Existing bookings keep the price they were made at.</p>
                </div>
              </div>
            </>
          )}
        </aside>
      </main>

      {selectedHour !== null && (
        <BookingModal
          key={`${dateKey}-${selectedHour}`}
          staff={staffMode} dateKey={dateKey} hour={selectedHour}
          rate={calcRate(config, dateKey, selectedHour)}
          onClose={() => setSelectedHour(null)} onConfirm={confirmBooking}
        />
      )}
      {detailHour !== null && bookings[slotId(dateKey, detailHour)] && (
        <DetailsModal
          key={`${dateKey}-${detailHour}`}
          dateKey={dateKey} hour={detailHour} booking={bookings[slotId(dateKey, detailHour)]}
          onClose={() => setDetailHour(null)} onCollect={collectPayment} onCancel={cancelBooking}
        />
      )}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-slate-950 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}