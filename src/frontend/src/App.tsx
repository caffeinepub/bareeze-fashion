import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Heart,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { SiInstagram, SiPinterest } from "react-icons/si";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

// ── Constants ──────────────────────────────────────────────────────────────────
const DELIVERY_CHARGE = 200;
const FREE_DELIVERY_THRESHOLD = 5999;
const CANCELLATION_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

type View = "shop" | "checkout" | "orders" | "admin" | "help" | "messages";
type CustomerMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
};

type Category = "All" | "New Arrivals" | "Best Sellers" | "Eid Sale";

type PaymentMethod = "jazzcash" | "easypaisa" | "mezzan" | "cod";

type Product = {
  soldOut?: boolean;
  id: number;
  name: string;
  price: string;
  originalPrice: string | null;
  category: Category;
  image: string;
  description: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Order = {
  id: number;
  date: string;
  items: CartItem[];
  total: number;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod: PaymentMethod;
  transactionId: string;
  orderedAt: number; // ms timestamp
  cancelledAt?: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "Maria B Unstich 3 Piece Lawn Suit",
    price: "RS:6000",
    originalPrice: null,
    category: "Best Sellers",
    image: "/assets/uploads/IMG-20260314-WA0006-3-1.jpg",
    soldOut: true,
    description:
      "A beautifully crafted unstitched 3-piece lawn suit by Maria B. Includes embroidered lawn shirt, printed lawn dupatta, and dyed cambric trouser. Perfect for festive occasions and formal gatherings.",
  },
  {
    id: 2,
    name: "Embroidered Pink Lawn Suit",
    price: "RS:9500",
    originalPrice: null,
    category: "New Arrivals",
    image: "/assets/generated/product-suit-pink.dim_600x750.jpg",
    description:
      "Crafted from pure mulberry silk, this understated white blouse flows effortlessly from desk to dinner. Tailored with a relaxed silhouette, pearl buttons, and a gently draped collar.",
  },
  {
    id: 3,
    name: "Ivory 3 Piece Chiffon Suit",
    price: "RS:14500",
    originalPrice: null,
    category: "New Arrivals",
    image: "/assets/uploads/IMG-20260314-WA0006-2-1.jpg",
    description:
      "Precision-cut tailored trousers in a refined crepe blend. A wide leg, high waist, and invisible side zip create a silhouette that is simultaneously classic and contemporary.",
  },
  {
    id: 4,
    name: "Maroon Formal Anarkali Suit",
    price: "RS:22000",
    originalPrice: null,
    category: "Best Sellers",
    image: "/assets/generated/product-suit-maroon.dim_600x750.jpg",
    description:
      "Our best-loved midi silhouette returns in a warm sand-beige. Woven from organic cotton voile, it falls gracefully at mid-calf with a subtle A-line flare and adjustable tie waist.",
  },
  {
    id: 5,
    name: "Floral Yellow Lawn 2 Piece",
    price: "RS:16500",
    originalPrice: "RS:24000",
    category: "Eid Sale",
    image: "/assets/generated/product-suit-yellow.dim_600x750.jpg",
    description:
      "Spun from Grade-A Mongolian cashmere, this relaxed-fit sweater is irresistibly soft. A clean round neck, dropped shoulders, and ribbed cuffs keep the design timeless season after season.",
  },
  {
    id: 6,
    name: "Unstitch 3 Piece Lawn Printed Shirt",
    price: "RS:2400",
    originalPrice: "RS:3500",
    category: "Eid Sale",
    image: "/assets/uploads/file_000000005210720b91a0a51f9c316d7b-1.png",
    description:
      "Printed Lawn shirt, Printed Lawn dupatta, Dyed cambric trouser.",
  },
];

const categories: Category[] = [
  "All",
  "New Arrivals",
  "Best Sellers",
  "Eid Sale",
];

function parsePrice(price: string): number {
  return Number.parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
}

function formatPrice(n: number): string {
  return `RS:${n.toLocaleString("en-PK")}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Order Status Badge ─────────────────────────────────────────────────────────
function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const styles: Record<Order["status"], string> = {
    Processing: "bg-amber-100 text-amber-800 border border-amber-200",
    Shipped: "bg-blue-100 text-blue-800 border border-blue-200",
    Delivered: "bg-green-100 text-green-800 border border-green-200",
    Cancelled: "bg-red-100 text-red-800 border border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-sans font-semibold rounded-sm uppercase tracking-wider ${
        styles[status] || "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

// ── Payment Method Card ────────────────────────────────────────────────────────
function PaymentMethodCard({
  method,
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  color,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <button
      type="button"
      data-ocid={`checkout.payment_${method}.toggle`}
      onClick={onSelect}
      className={`w-full text-left p-4 border-2 transition-all ${
        selected
          ? "border-foreground bg-foreground/5"
          : "border-border hover:border-foreground/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-sm ${color}`}>{icon}</div>
        <div className="flex-1">
          <p className="font-sans text-sm font-semibold">{title}</p>
          <p className="font-sans text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selected ? "border-foreground" : "border-muted-foreground"
          }`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-foreground" />}
        </div>
      </div>
    </button>
  );
}

// ── Checkout Page ──────────────────────────────────────────────────────────────
function CheckoutPage({
  cartItems,
  cartSubtotal,
  onPlaceOrder,
  onBack,
}: {
  cartItems: CartItem[];
  cartSubtotal: number;
  onPlaceOrder: (order: Omit<Order, "id" | "date">) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });
  const [errors, setErrors] = useState<
    Partial<typeof form & { paymentMethod: string; transactionId: string }>
  >({});
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [transactionId, setTransactionId] = useState("");

  // Delivery & discount calculations
  const deliveryCharge =
    cartSubtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const discountAmount = promoApplied ? Math.round(cartSubtotal * 0.1) : 0;
  const grandTotal = cartSubtotal - discountAmount + deliveryCharge;

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "BAREEZE10") {
      setPromoApplied(true);
      setPromoError("");
      toast.success("Promo code applied! 10% discount.");
    } else {
      setPromoApplied(false);
      setPromoError("Invalid promo code.");
    }
  };

  const validate = () => {
    const newErrors: Partial<
      typeof form & { paymentMethod: string; transactionId: string }
    > = {};
    if (!form.customerName.trim())
      newErrors.customerName = "Full name is required.";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!form.email.trim() || !form.email.includes("@"))
      newErrors.email = "Valid email is required.";
    if (!form.address.trim()) newErrors.address = "Street address is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (
      (paymentMethod === "jazzcash" ||
        paymentMethod === "easypaisa" ||
        paymentMethod === "mezzan") &&
      !transactionId.trim()
    ) {
      newErrors.transactionId =
        "Transaction ID is required for this payment method.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const id = Date.now() % 100000;
    setOrderId(id);
    onPlaceOrder({
      ...form,
      items: cartItems,
      total: grandTotal,
      status: "Processing",
      paymentMethod,
      transactionId,
      orderedAt: Date.now(),
    });
    setPlaced(true);
  };

  if (placed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <span className="font-display font-brand text-2xl font-bold tracking-widest-xl uppercase">
              Ghaza Fashion
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div
            data-ocid="checkout.success_state"
            className="text-center max-w-md"
          >
            <CheckCircle
              size={56}
              className="mx-auto text-foreground mb-6"
              strokeWidth={1.5}
            />
            <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-3">
              Order Confirmed
            </p>
            <h2 className="font-display text-4xl font-bold mb-4">Thank You!</h2>
            <p className="font-sans text-base text-muted-foreground leading-relaxed mb-2">
              Order{" "}
              <span className="font-semibold text-foreground">#{orderId}</span>{" "}
              has been placed successfully.
            </p>
            <p className="font-sans text-sm text-muted-foreground mb-2">
              Total paid:{" "}
              <span className="font-semibold text-foreground">
                {formatPrice(grandTotal)}
              </span>
            </p>
            {paymentMethod === "jazzcash" && (
              <div className="bg-green-50 border border-green-200 rounded-sm px-4 py-3 mb-4 text-left">
                <p className="font-sans text-xs text-green-800 font-semibold mb-1">
                  JazzCash Payment
                </p>
                <p className="font-sans text-xs text-green-700">
                  Transaction ID: {transactionId}
                </p>
              </div>
            )}
            {paymentMethod === "mezzan" && (
              <div className="bg-blue-50 border border-blue-200 rounded-sm px-4 py-3 mb-4 text-left">
                <p className="font-sans text-xs text-blue-800 font-semibold mb-1">
                  Meezan Bank Payment
                </p>
                <p className="font-sans text-xs text-blue-700">
                  Transaction ID: {transactionId}
                </p>
              </div>
            )}
            {paymentMethod === "easypaisa" && (
              <div className="bg-blue-50 border border-blue-200 rounded-sm px-4 py-3 mb-4 text-left">
                <p className="font-sans text-xs text-blue-800 font-semibold mb-1">
                  EasyPaisa Payment
                </p>
                <p className="font-sans text-xs text-blue-700">
                  Transaction ID: {transactionId}
                </p>
              </div>
            )}
            {paymentMethod === "cod" && (
              <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 mb-4 text-left">
                <p className="font-sans text-xs text-amber-800 font-semibold">
                  Cash on Delivery — pay when your order arrives.
                </p>
              </div>
            )}
            <p className="font-sans text-sm text-muted-foreground mb-2">
              You can cancel this order within{" "}
              <span className="font-semibold text-foreground">4 hours</span>{" "}
              from "My Orders".
            </p>
            <p className="font-sans text-sm text-muted-foreground mb-10">
              A confirmation will be sent to{" "}
              <span className="text-foreground">{form.email}</span>.
            </p>
            <Button
              data-ocid="checkout.continue_button"
              onClick={onBack}
              className="rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm px-10 py-6"
            >
              Continue Shopping
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display font-brand text-2xl font-bold tracking-widest-xl uppercase">
            Ghaza Fashion
          </span>
          <button
            type="button"
            data-ocid="checkout.back_button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-sans tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-2">
            Secure
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Checkout
          </h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">
          {/* ── Left: Form ── */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground">
                  Customer Details
                </h2>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="customerName"
                  className="text-xs tracking-widest-xl uppercase font-sans text-muted-foreground"
                >
                  Full Name <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="customerName"
                  data-ocid="checkout.name_input"
                  type="text"
                  placeholder="e.g. Fatima Khan"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  className="rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-12"
                />
                {errors.customerName && (
                  <p
                    data-ocid="checkout.name_error"
                    className="text-xs font-sans text-destructive"
                  >
                    {errors.customerName}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-xs tracking-widest-xl uppercase font-sans text-muted-foreground"
                >
                  Phone Number <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="phone"
                  data-ocid="checkout.phone_input"
                  type="tel"
                  placeholder="e.g. +92 300 1234567"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-12"
                />
                {errors.phone && (
                  <p
                    data-ocid="checkout.phone_error"
                    className="text-xs font-sans text-destructive"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs tracking-widest-xl uppercase font-sans text-muted-foreground"
                >
                  Email Address <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="email"
                  data-ocid="checkout.email_input"
                  type="email"
                  placeholder="e.g. fatima@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-12"
                />
                {errors.email && (
                  <p
                    data-ocid="checkout.email_error"
                    className="text-xs font-sans text-destructive"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="border-b border-border pb-3 pt-2">
                <h2 className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground">
                  Delivery Address
                </h2>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-xs tracking-widest-xl uppercase font-sans text-muted-foreground"
                >
                  Street Address <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="address"
                  data-ocid="checkout.address_input"
                  type="text"
                  placeholder="House #, Street, Area"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-12"
                />
                {errors.address && (
                  <p
                    data-ocid="checkout.address_error"
                    className="text-xs font-sans text-destructive"
                  >
                    {errors.address}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-xs tracking-widest-xl uppercase font-sans text-muted-foreground"
                >
                  City <span className="text-foreground">*</span>
                </Label>
                <Input
                  id="city"
                  data-ocid="checkout.city_input"
                  type="text"
                  placeholder="e.g. Lahore"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  className="rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-12"
                />
                {errors.city && (
                  <p
                    data-ocid="checkout.city_error"
                    className="text-xs font-sans text-destructive"
                  >
                    {errors.city}
                  </p>
                )}
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                <PaymentMethodCard
                  method="jazzcash"
                  selected={paymentMethod === "jazzcash"}
                  onSelect={() => setPaymentMethod("jazzcash")}
                  icon={<Smartphone size={18} className="text-green-700" />}
                  title="JazzCash"
                  subtitle="Send to: 0320-1435872 (Syed Muhammad Ali Shah)"
                  color="bg-green-100"
                />
                <PaymentMethodCard
                  method="easypaisa"
                  selected={paymentMethod === "easypaisa"}
                  onSelect={() => setPaymentMethod("easypaisa")}
                  icon={<Wallet size={18} className="text-teal-700" />}
                  title="EasyPaisa"
                  subtitle="Send to: 0320-1435872 (Syed Muhammad Ali Shah)"
                  color="bg-teal-100"
                />
                <PaymentMethodCard
                  method="mezzan"
                  selected={paymentMethod === "mezzan"}
                  onSelect={() => setPaymentMethod("mezzan")}
                  icon={<Building2 size={18} className="text-blue-700" />}
                  title="Meezan Bank"
                  subtitle="Account: 02820108082003 (Syed Muhammad Ali Shah)"
                  color="bg-blue-100"
                />
                <PaymentMethodCard
                  method="cod"
                  selected={paymentMethod === "cod"}
                  onSelect={() => setPaymentMethod("cod")}
                  icon={<Truck size={18} className="text-amber-700" />}
                  title="Cash on Delivery"
                  subtitle="Pay when your order arrives at your doorstep"
                  color="bg-amber-100"
                />
              </div>

              {/* JazzCash instructions */}
              {paymentMethod === "jazzcash" && (
                <div className="bg-green-50 border border-green-200 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Smartphone
                      size={16}
                      className="text-green-700 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-sans text-sm font-semibold text-green-800">
                        JazzCash Payment Instructions
                      </p>
                      <p className="font-sans text-xs text-green-700 mt-1">
                        Send payment to: <strong>0320-1435872</strong> (Account
                        Name: Syed Muhammad Ali Shah)
                      </p>
                      <p className="font-sans text-xs text-green-700">
                        After sending, enter your Transaction ID below.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="transactionId"
                      className="text-xs tracking-widest-xl uppercase font-sans text-green-800"
                    >
                      JazzCash Transaction ID{" "}
                      <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="transactionId"
                      data-ocid="checkout.transaction_input"
                      type="text"
                      placeholder="e.g. TXN123456789"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="rounded-none border-green-300 bg-white focus-visible:ring-green-500 font-sans text-sm h-11"
                    />
                    {errors.transactionId && (
                      <p
                        data-ocid="checkout.transaction_error"
                        className="text-xs font-sans text-destructive"
                      >
                        {errors.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* EasyPaisa instructions */}
              {paymentMethod === "mezzan" && (
                <div className="bg-blue-50 border border-blue-200 rounded-sm px-4 py-3 mb-4 text-left">
                  <p className="font-sans text-xs text-blue-800 font-semibold mb-1">
                    Meezan Bank Payment
                  </p>
                  <p className="font-sans text-xs text-blue-700">
                    Transaction ID: {transactionId}
                  </p>
                </div>
              )}
              {paymentMethod === "easypaisa" && (
                <div className="bg-teal-50 border border-teal-200 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Wallet
                      size={16}
                      className="text-teal-700 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-sans text-sm font-semibold text-teal-800">
                        EasyPaisa Payment Instructions
                      </p>
                      <p className="font-sans text-xs text-teal-700 mt-1">
                        Send payment to: <strong>0320-1435872</strong> (Account
                        Name: Syed Muhammad Ali Shah)
                      </p>
                      <p className="font-sans text-xs text-teal-700">
                        After sending, enter your Transaction ID below.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="transactionId"
                      className="text-xs tracking-widest-xl uppercase font-sans text-teal-800"
                    >
                      EasyPaisa Transaction ID{" "}
                      <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="transactionId"
                      data-ocid="checkout.transaction_input"
                      type="text"
                      placeholder="e.g. EP123456789"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="rounded-none border-teal-300 bg-white focus-visible:ring-teal-500 font-sans text-sm h-11"
                    />
                    {errors.transactionId && (
                      <p
                        data-ocid="checkout.transaction_error"
                        className="text-xs font-sans text-destructive"
                      >
                        {errors.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Meezan Bank instructions */}
              {paymentMethod === "mezzan" && (
                <div className="bg-blue-50 border border-blue-200 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Building2
                      size={16}
                      className="text-blue-700 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-sans text-sm font-semibold text-blue-800">
                        Meezan Bank Payment Instructions
                      </p>
                      <p className="font-sans text-xs text-blue-700 mt-1">
                        Transfer to account: <strong>02820108082003</strong>{" "}
                        (Account Name: Syed Muhammad Ali Shah)
                      </p>
                      <p className="font-sans text-xs text-blue-700">
                        After transferring, enter your Transaction ID below.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="transactionId"
                      className="text-xs tracking-widest-xl uppercase font-sans text-blue-800"
                    >
                      Meezan Bank Transaction ID{" "}
                      <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="transactionId"
                      data-ocid="checkout.transaction_input"
                      type="text"
                      placeholder="e.g. MBL123456789"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="rounded-none border-blue-300 bg-white focus-visible:ring-blue-500 font-sans text-sm h-11"
                    />
                    {errors.transactionId && (
                      <p
                        data-ocid="checkout.transaction_error"
                        className="text-xs font-sans text-destructive"
                      >
                        {errors.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* COD note */}
              {paymentMethod === "cod" && (
                <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-2">
                  <Truck size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-amber-800">
                      Cash on Delivery
                    </p>
                    <p className="font-sans text-xs text-amber-700 mt-1">
                      You will pay in cash when your order is delivered to your
                      doorstep. No advance payment required.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile submit */}
            <Button
              type="submit"
              data-ocid="checkout.submit_button"
              className="w-full rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm py-6 lg:hidden"
            >
              Place Order · {formatPrice(grandTotal)}
            </Button>
          </form>

          {/* ── Right: Summary ── */}
          <aside className="lg:sticky lg:top-24 space-y-6 border border-border p-6 bg-background">
            <div>
              <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground mb-4">
                Order Summary
              </p>
              {cartItems.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground">
                  Your cart is empty.
                </p>
              ) : (
                <div className="space-y-5">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex gap-4">
                      <div className="w-16 h-20 bg-border shrink-0 overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-medium leading-snug">
                          {item.product.name}
                        </p>
                        <p className="font-sans text-xs text-muted-foreground mt-1">
                          Qty: {item.quantity}
                        </p>
                        <p className="font-sans text-sm font-semibold mt-1">
                          {formatPrice(
                            parsePrice(item.product.price) * item.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            {/* Promo Code */}
            <div className="space-y-2">
              <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground flex items-center gap-1.5">
                <Tag size={12} /> Promo Code
              </p>
              <div className="flex gap-2">
                <Input
                  data-ocid="checkout.promo_input"
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoApplied(false);
                    setPromoError("");
                  }}
                  className="rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-10 flex-1"
                />
                <Button
                  type="button"
                  data-ocid="checkout.promo_button"
                  onClick={handleApplyPromo}
                  className="rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans uppercase text-xs px-4 h-10 shrink-0"
                >
                  Apply
                </Button>
              </div>
              {promoApplied && (
                <p className="text-xs font-sans text-green-600 font-medium">
                  ✓ BAREEZE10 applied — 10% off!
                </p>
              )}
              {promoError && (
                <p
                  data-ocid="checkout.promo_error"
                  className="text-xs font-sans text-destructive"
                >
                  {promoError}
                </p>
              )}
              <p className="text-xs font-sans text-muted-foreground">
                Try: BAREEZE10 for 10% off
              </p>
            </div>

            <Separator className="bg-border" />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-sans text-xs tracking-editorial uppercase text-muted-foreground">
                  Subtotal
                </p>
                <p className="font-sans text-sm font-medium">
                  {formatPrice(cartSubtotal)}
                </p>
              </div>
              {promoApplied && (
                <div className="flex justify-between items-center">
                  <p className="font-sans text-xs tracking-editorial uppercase text-green-600">
                    Discount (10%)
                  </p>
                  <p className="font-sans text-sm font-medium text-green-600">
                    -{formatPrice(discountAmount)}
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <p className="font-sans text-xs tracking-editorial uppercase text-muted-foreground flex items-center gap-1">
                  <Truck size={12} /> Delivery
                </p>
                {deliveryCharge === 0 ? (
                  <p className="font-sans text-xs font-semibold text-green-600">
                    FREE
                  </p>
                ) : (
                  <p className="font-sans text-sm font-medium">
                    {formatPrice(DELIVERY_CHARGE)}
                  </p>
                )}
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="flex justify-between items-center">
              <p className="font-display text-base font-bold">Total</p>
              <p className="font-display text-xl font-bold">
                {formatPrice(grandTotal)}
              </p>
            </div>

            {/* Desktop place order */}
            <Button
              type="button"
              data-ocid="checkout.submit_button"
              onClick={() => {
                document.getElementById("checkout-form-submit")?.click();
              }}
              className="w-full rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm py-6 hidden lg:flex"
            >
              Place Order · {formatPrice(grandTotal)}
            </Button>
            {/* Hidden real submit button */}
            <button
              id="checkout-form-submit"
              type="submit"
              form="checkout-form"
              className="hidden"
            />
            <p className="font-sans text-xs text-muted-foreground text-center">
              Orders can be cancelled within 4 hours of placement.
            </p>
          </aside>
        </div>
      </main>

      <footer className="bg-background border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-xs font-sans text-muted-foreground">
            © {new Date().getFullYear()} Ghaza Fashion.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Orders Page ─────────────────────────────────────────────────────────────────
function OrdersPage({
  orders,
  onBack,
  onCancelOrder,
}: {
  orders: Order[];
  onBack: () => void;
  onCancelOrder: (orderId: number) => void;
}) {
  const now = Date.now();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display font-brand text-2xl font-bold tracking-widest-xl uppercase">
            Ghaza Fashion
          </span>
          <button
            type="button"
            data-ocid="orders.back_button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-sans tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-2">
            History
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            My Orders
          </h1>
        </div>

        {orders.length === 0 ? (
          <div
            data-ocid="orders.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center gap-6"
          >
            <Package size={52} className="text-border" strokeWidth={1.5} />
            <div>
              <p className="font-display text-xl font-semibold mb-2">
                No orders yet
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                Your orders will appear here once you&apos;ve made a purchase.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-sans tracking-editorial uppercase underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div data-ocid="orders.list" className="space-y-6">
            {orders.map((order, idx) => {
              const isCancellable =
                now - order.orderedAt < CANCELLATION_WINDOW_MS &&
                order.status !== "Cancelled";
              const windowPassed =
                now - order.orderedAt >= CANCELLATION_WINDOW_MS &&
                order.status !== "Cancelled" &&
                order.status !== "Delivered";

              return (
                <div
                  key={order.id}
                  data-ocid={`orders.item.${idx + 1}`}
                  className="border border-border bg-background"
                >
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-border bg-secondary">
                    <div className="space-y-0.5">
                      <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground">
                        Order
                      </p>
                      <p className="font-display text-lg font-bold">
                        #{order.id}
                      </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground">
                        Date
                      </p>
                      <p className="font-sans text-sm">{order.date}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground">
                        Customer
                      </p>
                      <p className="font-sans text-sm font-medium">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <p className="font-display text-lg font-bold">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="px-6 py-5 space-y-3">
                    <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground mb-4">
                      Items
                    </p>
                    {order.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 items-center"
                      >
                        <div className="w-12 h-14 bg-secondary shrink-0 overflow-hidden">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <p className="font-sans text-sm">
                            {item.product.name}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground shrink-0">
                            × {item.quantity}
                          </p>
                          <p className="font-sans text-sm font-medium shrink-0">
                            {formatPrice(
                              parsePrice(item.product.price) * item.quantity,
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery info + payment */}
                  <div className="px-6 py-4 border-t border-border bg-secondary/50 flex flex-wrap gap-6">
                    <div>
                      <p className="font-sans text-xs tracking-editorial uppercase text-muted-foreground mb-0.5">
                        Phone
                      </p>
                      <p className="font-sans text-sm">{order.phone}</p>
                    </div>
                    <div>
                      <p className="font-sans text-xs tracking-editorial uppercase text-muted-foreground mb-0.5">
                        Email
                      </p>
                      <p className="font-sans text-sm">{order.email}</p>
                    </div>
                    <div>
                      <p className="font-sans text-xs tracking-editorial uppercase text-muted-foreground mb-0.5">
                        Address
                      </p>
                      <p className="font-sans text-sm">
                        {order.address}, {order.city}
                      </p>
                    </div>
                    <div>
                      <p className="font-sans text-xs tracking-editorial uppercase text-muted-foreground mb-0.5">
                        Payment
                      </p>
                      <p className="font-sans text-sm font-medium capitalize">
                        {order.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : order.paymentMethod === "jazzcash"
                            ? "JazzCash"
                            : order.paymentMethod === "mezzan"
                              ? "Meezan Bank"
                              : "EasyPaisa"}
                      </p>
                      {order.transactionId && (
                        <p className="font-sans text-xs text-muted-foreground">
                          TXN: {order.transactionId}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cancellation section */}
                  <div className="px-6 py-4 border-t border-border">
                    {order.status === "Cancelled" ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={14} className="shrink-0" />
                        <p className="font-sans text-sm font-medium">
                          Order Cancelled
                        </p>
                        {order.cancelledAt && (
                          <span className="font-sans text-xs text-muted-foreground ml-1">
                            on {formatDate(order.cancelledAt)}
                          </span>
                        )}
                      </div>
                    ) : isCancellable ? (
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <AlertCircle size={13} className="shrink-0" />
                          <p className="font-sans text-xs">
                            You can cancel this order within 4 hours of placing
                            it.
                          </p>
                        </div>
                        <Button
                          type="button"
                          data-ocid={`orders.delete_button.${idx + 1}`}
                          onClick={() => onCancelOrder(order.id)}
                          variant="destructive"
                          className="rounded-none font-sans tracking-editorial uppercase text-xs px-5 py-2 h-auto"
                        >
                          Cancel Order
                        </Button>
                      </div>
                    ) : windowPassed ? (
                      <p className="font-sans text-xs text-muted-foreground">
                        Cancellation window has passed — orders can only be
                        cancelled within 4 hours of placing.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-background border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-xs font-sans text-muted-foreground">
            © {new Date().getFullYear()} Ghaza Fashion.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Message Centre ───────────────────────────────────────────────────────────
function MessageCentre({ onBack }: { onBack: () => void }) {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errs.email = "Invalid email";
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (!form.message.trim()) errs.message = "Message is required";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const saved: CustomerMessage[] = JSON.parse(
      localStorage.getItem("bf_messages") || "[]",
    );
    const newMsg: CustomerMessage = {
      id: Date.now().toString(),
      ...form,
      timestamp: new Date().toISOString(),
      read: false,
    };
    localStorage.setItem("bf_messages", JSON.stringify([newMsg, ...saved]));
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            data-ocid="messages.back.button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to Shop
          </button>
          <span className="text-border">|</span>
          <span className="font-display text-sm font-semibold tracking-widest uppercase">
            Ghaza Fashion
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
            Message Us
          </h1>
          <p className="text-muted-foreground text-lg">
            Have a question or need help? Send us a message and we'll get back
            to you soon.
          </p>
        </div>

        {submitted ? (
          <div
            data-ocid="messages.success_state"
            className="border border-border rounded-xl p-10 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">
              Message Sent!
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Thank you for reaching out. We'll respond to{" "}
              <strong>{form.email}</strong> as soon as possible.
            </p>
            <button
              type="button"
              data-ocid="messages.back_shop.button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm border border-border px-6 py-3 hover:bg-muted/40 transition-colors font-sans tracking-editorial uppercase"
            >
              Back to Shop
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-ocid="messages.form"
            className="space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="msg-name"
                  className="text-xs font-sans uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Full Name *
                </label>
                <input
                  id="msg-name"
                  data-ocid="messages.name.input"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Your name"
                  className={`w-full border px-4 py-3 text-sm font-sans bg-background outline-none focus:border-foreground transition-colors ${errors.name ? "border-red-400" : "border-border"}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="msg-email"
                  className="text-xs font-sans uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Email *
                </label>
                <input
                  id="msg-email"
                  data-ocid="messages.email.input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className={`w-full border px-4 py-3 text-sm font-sans bg-background outline-none focus:border-foreground transition-colors ${errors.email ? "border-red-400" : "border-border"}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="msg-phone"
                  className="text-xs font-sans uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Phone (Optional)
                </label>
                <input
                  id="msg-phone"
                  data-ocid="messages.phone.input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="03xx-xxxxxxx"
                  className="w-full border border-border px-4 py-3 text-sm font-sans bg-background outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="msg-subject"
                  className="text-xs font-sans uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Subject *
                </label>
                <input
                  id="msg-subject"
                  data-ocid="messages.subject.input"
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="Order issue, product question…"
                  className={`w-full border px-4 py-3 text-sm font-sans bg-background outline-none focus:border-foreground transition-colors ${errors.subject ? "border-red-400" : "border-border"}`}
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="msg-message"
                className="text-xs font-sans uppercase tracking-widest text-muted-foreground block mb-2"
              >
                Message *
              </label>
              <textarea
                id="msg-message"
                data-ocid="messages.message.textarea"
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Write your message here…"
                rows={6}
                className={`w-full border px-4 py-3 text-sm font-sans bg-background outline-none focus:border-foreground transition-colors resize-none ${errors.message ? "border-red-400" : "border-border"}`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>
            <button
              type="submit"
              data-ocid="messages.submit.button"
              className="w-full bg-foreground text-background py-4 text-sm font-sans tracking-editorial uppercase hover:bg-foreground/80 transition-colors"
            >
              Send Message
            </button>
            <p className="text-xs text-muted-foreground text-center">
              We typically reply within 24 hours
            </p>
          </form>
        )}

        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <a
            href="mailto:ghazafashion2234@gmail.com"
            data-ocid="messages.email.link"
            className="flex items-center gap-3 p-4 border border-border hover:bg-muted/40 transition-colors"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <div>
              <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                Email
              </p>
              <p className="text-sm">ghazafashion2234@gmail.com</p>
            </div>
          </a>
          <a
            href="https://wa.me/923224402086"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="messages.whatsapp.link"
            className="flex items-center gap-3 p-4 border border-border hover:bg-muted/40 transition-colors"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            <div>
              <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                WhatsApp
              </p>
              <p className="text-sm">03224402086</p>
            </div>
          </a>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-sans text-xs text-muted-foreground tracking-widest uppercase">
            © {new Date().getFullYear()} Ghaza Fashion
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Help Centre ─────────────────────────────────────────────────────────────
function HelpCentre({
  onBack,
  onMessages,
}: { onBack: () => void; onMessages: () => void }) {
  const faqs = [
    {
      q: "How do I place an order?",
      a: 'Browse our collections, click on any product to view details, then click "Add to Cart" or "Buy Now". Proceed to checkout, fill in your name, phone number, email, and address, then choose your preferred payment method.',
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept JazzCash (0320-1435872), EasyPaisa (0320-1435872), Meezan Bank (02820108082003), and Cash on Delivery. For digital payments, please enter your transaction ID at checkout. Account name: Syed Muhammad Ali Shah.",
    },
    {
      q: "How long does delivery take?",
      a: "Orders are typically delivered within 3–7 business days depending on your location. Check your order status anytime in the My Orders section.",
    },
    {
      q: "Can I cancel my order?",
      a: "Yes — orders can be cancelled within 4 hours of placing them. Go to My Orders (the bag icon in the header), find your order, and click Cancel Order. After 4 hours the cancellation window closes.",
    },
    {
      q: "How do I use a promo code?",
      a: "At checkout, enter BAREEZE10 in the promo code field for 10% off your entire order.",
    },
    {
      q: "What is the delivery charge?",
      a: "Orders totalling RS:5,999 or below have a RS:200 delivery charge. Orders above RS:5,999 qualify for free delivery. Your cart shows progress toward free delivery.",
    },
    {
      q: "What if I receive a wrong or damaged item?",
      a: "Contact us right away via WhatsApp at 03224402086 or email ghazafashion2234@gmail.com with a photo of the item and your order number. We will resolve the issue as quickly as possible.",
    },
    {
      q: "How do I track my order?",
      a: "Click the bag icon in the header to open My Orders. You can see the current status of every order: Processing, Shipped, Delivered, or Cancelled.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            data-ocid="help.back.button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to Shop
          </button>
          <span className="text-border">|</span>
          <span className="font-display text-sm font-semibold tracking-widest uppercase">
            Ghaza Fashion
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
            Help Centre
          </h1>
          <p className="text-muted-foreground text-lg">
            We are here to help. Find answers below or reach out directly.
          </p>
        </div>

        {/* Contact Us */}
        <section className="mb-12" data-ocid="help.contact.section">
          <h2 className="font-display text-xl font-semibold mb-6 pb-2 border-b border-border">
            Contact Us
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:ghazafashion2234@gmail.com"
              data-ocid="help.email.link"
              className="flex items-start gap-4 p-5 rounded-xl border border-border hover:bg-muted/40 transition-colors group"
            >
              <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Email Us</p>
                <p className="text-sm text-muted-foreground">
                  ghazafashion2234@gmail.com
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  We reply within 24 hours
                </p>
              </div>
            </a>
            <a
              href="https://wa.me/923224402086"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="help.whatsapp.link"
              className="flex items-start gap-4 p-5 rounded-xl border border-border hover:bg-muted/40 transition-colors group"
            >
              <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">WhatsApp</p>
                <p className="text-sm text-muted-foreground">03224402086</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mon–Sat, 10am–8pm
                </p>
              </div>
            </a>
          </div>
          <div className="mt-4">
            <button
              type="button"
              data-ocid="help.message_us.button"
              onClick={onMessages}
              className="w-full flex items-center justify-center gap-3 p-5 rounded-xl border border-foreground bg-foreground text-background hover:bg-foreground/80 transition-colors"
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-sans text-sm tracking-editorial uppercase font-medium">
                Send Us a Message
              </span>
            </button>
          </div>
        </section>

        {/* Desi Clothes Photo */}
        <section className="mb-12" data-ocid="help.photo.section">
          <img
            src="/assets/generated/helpcentre-ghaza-wall.dim_900x500.jpg"
            alt="Ghaza Fashion desi clothes collection"
            className="w-full rounded-2xl object-cover max-h-96"
          />
        </section>

        {/* FAQ */}
        <section data-ocid="help.faq.section">
          <h2 className="font-display text-xl font-semibold mb-6 pb-2 border-b border-border">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                data-ocid={`help.faq.item.${i + 1}`}
                className="border border-border rounded-xl px-1 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-4 text-sm font-medium hover:no-underline hover:text-foreground text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ghaza Fashion. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
type BackendOrder = {
  id: bigint;
  customerName: string;
  status: string;
  deliveryCharge: bigint;
  total: bigint;
  paymentMethod: string;
  city: string;
  email: string;
  orderedAt: bigint;
  cancelledAt?: bigint;
  address: string;
  phone: string;
  items: Array<{
    productId: bigint;
    productName: string;
    quantity: bigint;
    price: bigint;
  }>;
  subtotal: bigint;
  transactionId: string;
};

function AdminPanel({ onBack }: { onBack: () => void }) {
  const { actor, isFetching } = useActor();
  const { identity, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [orders, setAdminOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<bigint | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<bigint | null>(null);
  const [assigningAdmin, setAssigningAdmin] = useState(false);

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    if (!isLoggedIn || !actor || isFetching) return;
    let cancelled = false;
    setCheckingAdmin(true);
    const checkAdmin = async () => {
      try {
        const result = await Promise.race([
          actor.isCallerAdmin() as Promise<boolean>,
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 15000),
          ),
        ]);
        if (!cancelled) {
          setIsAdmin(result);
          if (result) loadOrders();
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setCheckingAdmin(false);
      }
    };
    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, actor, isFetching]);

  const handleMakeAdmin = async () => {
    if (!actor) return;
    setAssigningAdmin(true);
    try {
      const principal = identity!.getPrincipal();
      await (actor as any).assignCallerUserRole(principal, { admin: null });
      const result = await actor.isCallerAdmin();
      setIsAdmin(result as boolean);
      if (result) loadOrders();
      toast.success("Admin access granted!");
    } catch {
      toast.error("Could not assign admin role. Please contact support.");
    } finally {
      setAssigningAdmin(false);
    }
  };

  const loadOrders = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const result = await actor.getAllOrders();
      setAdminOrders(result as BackendOrder[]);
    } catch {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: bigint, newStatus: string) => {
    if (!actor) return;
    setUpdatingStatus(orderId);
    try {
      await actor.updateOrderStatus(orderId, newStatus);
      setAdminOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      toast.success(`Order #${orderId} status updated to ${newStatus}.`);
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "Processing").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={20} className="text-muted-foreground" />
            <span className="font-display font-brand text-2xl font-bold tracking-widest-xl uppercase">
              Admin Panel
            </span>
          </div>
          <button
            type="button"
            data-ocid="admin.back_button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-sans tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {/* Step 1: Not logged in — show login screen */}
        {!isLoggedIn ? (
          <div
            data-ocid="admin.login_state"
            className="max-w-md mx-auto text-center py-24"
          >
            <Shield
              size={52}
              className="mx-auto text-muted-foreground mb-6"
              strokeWidth={1.5}
            />
            <h1 className="font-display text-3xl font-bold mb-3">
              Admin Login
            </h1>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              Sign in with Internet Identity to access the admin dashboard.
            </p>
            <Button
              type="button"
              data-ocid="admin.login_button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm px-10 py-6"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Signing In…
                </>
              ) : (
                "Sign In with Internet Identity"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              A browser window will open for Internet Identity. Allow popups if
              prompted.
            </p>
            <Button
              type="button"
              variant="ghost"
              data-ocid="admin.back_button"
              onClick={onBack}
              className="mt-6 font-sans tracking-editorial uppercase text-xs text-muted-foreground"
            >
              <ArrowLeft size={12} className="mr-2" />
              Back to Shop
            </Button>
          </div>
        ) : checkingAdmin || isFetching ? (
          /* Step 2: Logged in, checking admin status */
          <div
            data-ocid="admin.loading_state"
            className="flex flex-col items-center gap-4 py-24"
          >
            <RefreshCw
              size={24}
              className="animate-spin text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground font-sans">
              Verifying admin access…
            </p>
          </div>
        ) : isAdmin === false ? (
          /* Step 3: Logged in but not admin yet */
          <div
            data-ocid="admin.error_state"
            className="max-w-md mx-auto text-center py-24"
          >
            <Shield
              size={52}
              className="mx-auto text-muted-foreground mb-6"
              strokeWidth={1.5}
            />
            <h1 className="font-display text-3xl font-bold mb-4">
              Access Required
            </h1>
            <p className="font-sans text-sm text-muted-foreground mb-8">
              Your account does not have admin access yet. If you are the store
              owner, click below to activate admin access for your account.
            </p>
            <Button
              type="button"
              data-ocid="admin.activate_button"
              onClick={handleMakeAdmin}
              disabled={assigningAdmin}
              className="w-full rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm px-10 py-6 mb-4"
            >
              {assigningAdmin ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Activating…
                </>
              ) : (
                "Activate Admin Access"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              data-ocid="admin.back_button"
              onClick={onBack}
              className="font-sans tracking-editorial uppercase text-xs text-muted-foreground"
            >
              <ArrowLeft size={12} className="mr-2" />
              Back to Shop
            </Button>
          </div>
        ) : (
          /* Step 4: Admin dashboard */
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-2">
                  Dashboard
                </p>
                <h1 className="font-display text-4xl font-bold">All Orders</h1>
              </div>
              <Button
                type="button"
                data-ocid="admin.refresh_button"
                onClick={loadOrders}
                variant="outline"
                className="rounded-none font-sans tracking-editorial uppercase text-xs"
              >
                <RefreshCw size={14} className="mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="border border-border p-5">
                <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground mb-1">
                  Total Orders
                </p>
                <p className="font-display text-3xl font-bold">
                  {orders.length}
                </p>
              </div>
              <div className="border border-border p-5">
                <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <p className="font-display text-3xl font-bold">
                  {formatPrice(totalRevenue)}
                </p>
              </div>
              <div className="border border-border p-5">
                <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground mb-1">
                  Pending
                </p>
                <p className="font-display text-3xl font-bold">
                  {pendingCount}
                </p>
              </div>
              <div className="border border-border p-5">
                <p className="font-sans text-xs tracking-widest-xl uppercase text-muted-foreground mb-1">
                  Unread Messages
                </p>
                <p className="font-display text-3xl font-bold">
                  {
                    JSON.parse(
                      localStorage.getItem("bf_messages") || "[]",
                    ).filter((m: CustomerMessage) => !m.read).length
                  }
                </p>
              </div>
            </div>

            {loading ? (
              <div
                data-ocid="admin.loading_state"
                className="flex justify-center py-20"
              >
                <RefreshCw
                  size={24}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : orders.length === 0 ? (
              <div
                data-ocid="admin.empty_state"
                className="text-center py-20 border border-border"
              >
                <Package
                  size={48}
                  className="mx-auto text-border mb-4"
                  strokeWidth={1.5}
                />
                <p className="font-sans text-muted-foreground">
                  No orders yet.
                </p>
              </div>
            ) : (
              <div data-ocid="admin.orders.list" className="space-y-4">
                {orders.map((order, idx) => (
                  <div
                    key={String(order.id)}
                    data-ocid={`admin.orders.item.${idx + 1}`}
                    className="border border-border bg-background"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id,
                        )
                      }
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-6">
                        <span className="font-display text-lg font-bold">
                          #{String(order.id)}
                        </span>
                        <span className="font-sans text-sm">
                          {order.customerName}
                        </span>
                        <span className="font-sans text-sm text-muted-foreground">
                          {order.phone}
                        </span>
                        <Badge
                          variant="outline"
                          className={`rounded-none text-xs font-sans tracking-editorial uppercase ${
                            order.status === "Processing"
                              ? "border-amber-500 text-amber-600"
                              : order.status === "Shipped"
                                ? "border-blue-500 text-blue-600"
                                : order.status === "Delivered"
                                  ? "border-green-500 text-green-600"
                                  : "border-red-400 text-red-500"
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display font-bold">
                          {formatPrice(Number(order.total))}
                        </span>
                        {expandedOrderId === order.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </button>

                    {expandedOrderId === order.id && (
                      <div className="border-t border-border px-6 py-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">
                              Email
                            </p>
                            <p>{order.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">
                              Address
                            </p>
                            <p>
                              {order.address}, {order.city}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">
                              Payment
                            </p>
                            <p>
                              {order.paymentMethod}
                              {order.transactionId
                                ? ` — TXN: ${order.transactionId}`
                                : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">
                              Date
                            </p>
                            <p>
                              {new Date(
                                Number(order.orderedAt) / 1_000_000,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2 font-sans">
                            Items
                          </p>
                          <div className="space-y-1">
                            {order.items.map((item, i) => (
                              <div
                                key={`${String(order.id)}-item-${i}`}
                                className="flex justify-between text-sm font-sans"
                              >
                                <span>
                                  {item.productName} × {String(item.quantity)}
                                </span>
                                <span>
                                  {formatPrice(
                                    Number(item.price) * Number(item.quantity),
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                          <Separator className="my-3" />
                          <div className="flex justify-between text-sm font-sans">
                            <span className="text-muted-foreground">
                              Delivery
                            </span>
                            <span>
                              {Number(order.deliveryCharge) === 0
                                ? "Free"
                                : formatPrice(Number(order.deliveryCharge))}
                            </span>
                          </div>
                          <div className="flex justify-between font-display font-bold mt-1">
                            <span>Total</span>
                            <span>{formatPrice(Number(order.total))}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-sans text-muted-foreground uppercase tracking-widest">
                            Update Status:
                          </p>
                          <Select
                            value={order.status}
                            onValueChange={(val) =>
                              handleStatusUpdate(order.id, val)
                            }
                            disabled={updatingStatus === order.id}
                          >
                            <SelectTrigger
                              data-ocid={`admin.orders.select.${idx + 1}`}
                              className="w-44 rounded-none font-sans text-xs uppercase tracking-editorial"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {[
                                "Processing",
                                "Shipped",
                                "Delivered",
                                "Cancelled",
                              ].map((s) => (
                                <SelectItem
                                  key={s}
                                  value={s}
                                  className="font-sans text-xs uppercase tracking-editorial"
                                >
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {updatingStatus === order.id && (
                            <RefreshCw
                              size={14}
                              className="animate-spin text-muted-foreground"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Customer Messages */}
            <AdminMessages />
          </div>
        )}
      </main>

      <footer className="bg-background border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-xs font-sans text-muted-foreground">
            © {new Date().getFullYear()} Ghaza Fashion — Admin
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Admin Messages ───────────────────────────────────────────────────────────
function AdminMessages() {
  const [messages, setMessages] = React.useState<CustomerMessage[]>(() =>
    JSON.parse(localStorage.getItem("bf_messages") || "[]"),
  );
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const markRead = (id: string) => {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, read: true } : m,
    );
    setMessages(updated);
    localStorage.setItem("bf_messages", JSON.stringify(updated));
  };

  const deleteMsg = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    setMessages(updated);
    localStorage.setItem("bf_messages", JSON.stringify(updated));
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-4" data-ocid="admin.messages.section">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-2">
            Inbox
          </p>
          <h2 className="font-display text-3xl font-bold">
            Customer Messages
            {unreadCount > 0 && (
              <span className="ml-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background font-sans text-sm font-bold">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
      </div>

      {messages.length === 0 ? (
        <div
          data-ocid="admin.messages.empty_state"
          className="text-center py-20 border border-border"
        >
          <svg
            aria-hidden="true"
            className="mx-auto text-border mb-4"
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="font-sans text-muted-foreground">No messages yet.</p>
        </div>
      ) : (
        <div data-ocid="admin.messages.list" className="space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              data-ocid={`admin.messages.item.${idx + 1}`}
              className={`border bg-background ${!msg.read ? "border-foreground" : "border-border"}`}
            >
              <button
                type="button"
                onClick={() => {
                  setExpandedId(expandedId === msg.id ? null : msg.id);
                  markRead(msg.id);
                }}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-5">
                  {!msg.read && (
                    <span className="w-2 h-2 rounded-full bg-foreground flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-display text-base font-bold">
                      {msg.name}
                    </span>
                    <span className="font-sans text-sm text-muted-foreground ml-3">
                      {msg.email}
                    </span>
                    {msg.phone && (
                      <span className="font-sans text-sm text-muted-foreground ml-3">
                        {msg.phone}
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-sm text-muted-foreground">
                    {msg.subject}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {expandedId === msg.id ? (
                      <path d="m18 15-6-6-6 6" />
                    ) : (
                      <path d="m6 9 6 6 6-6" />
                    )}
                  </svg>
                </div>
              </button>
              {expandedId === msg.id && (
                <div className="border-t border-border px-6 py-5 space-y-4">
                  <div>
                    <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-2">
                      Subject
                    </p>
                    <p className="font-sans text-sm font-medium">
                      {msg.subject}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-2">
                      Message
                    </p>
                    <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      data-ocid={`admin.messages.reply.button.${idx + 1}`}
                      className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-editorial border border-border px-4 py-2 hover:bg-muted/40 transition-colors"
                    >
                      Reply by Email
                    </a>
                    {msg.phone && (
                      <a
                        href={`https://wa.me/92${msg.phone.replace(/^0/, "").replace(/-/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-ocid={`admin.messages.whatsapp.button.${idx + 1}`}
                        className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-editorial border border-border px-4 py-2 hover:bg-muted/40 transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      data-ocid={`admin.messages.delete_button.${idx + 1}`}
                      onClick={() => deleteMsg(msg.id)}
                      className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-editorial border border-red-300 text-red-500 px-4 py-2 hover:bg-red-50 transition-colors ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("shop");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [email, setEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);

  // Wishlist state
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [nextOrderId, setNextOrderId] = useState(1001);

  const { actor } = useActor();
  useInternetIdentity();
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");

  const handleAdminPasswordSubmit = () => {
    if (adminPassword === "mshd1981!") {
      setShowAdminPasswordModal(false);
      setAdminPassword("");
      setAdminPasswordError("");
      setView("admin");
    } else {
      setAdminPasswordError("Incorrect password");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      searchTerm === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Delivery charge calculation
  const cartSubtotal = cartItems.reduce(
    (sum, i) => sum + parsePrice(i.product.price) * i.quantity,
    0,
  );
  const cartDeliveryCharge =
    cartSubtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const cartGrandTotal =
    cartSubtotal + (cartItems.length > 0 ? cartDeliveryCharge : 0);

  // ── Wishlist toggle ─────────────────────────────────────────
  const toggleWishlist = (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        toast("Removed from wishlist.");
      } else {
        next.add(productId);
        toast.success("Added to wishlist!");
      }
      return next;
    });
  };

  // ── Cart helpers ────────────────────────────────────────────
  const addToCart = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // ── Modal open / close ──────────────────────────────────────
  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
  };

  const closeProduct = () => setSelectedProduct(null);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, modalQty);
    toast.success(`${selectedProduct.name} added to cart.`);
    closeProduct();
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, modalQty);
    closeProduct();
    setCartOpen(true);
  };

  // ── Place order ─────────────────────────────────────────────
  const handlePlaceOrder = async (orderData: Omit<Order, "id" | "date">) => {
    const newOrder: Order = {
      ...orderData,
      id: nextOrderId,
      date: new Date().toLocaleDateString("en-PK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setNextOrderId((n) => n + 1);
    setCartItems([]);

    // Save to backend if actor is available
    if (actor) {
      try {
        const backendItems = orderData.items.map((item) => ({
          productId: BigInt(item.product.id),
          productName: item.product.name,
          quantity: BigInt(item.quantity),
          price: BigInt(parsePrice(item.product.price)),
        }));
        const deliveryCharge =
          orderData.total -
          orderData.items.reduce(
            (sum, i) => sum + parsePrice(i.product.price) * i.quantity,
            0,
          );
        await actor.placeOrder(
          orderData.customerName,
          orderData.phone,
          orderData.email,
          orderData.address,
          orderData.city,
          backendItems,
          BigInt(
            orderData.items.reduce(
              (sum, i) => sum + parsePrice(i.product.price) * i.quantity,
              0,
            ),
          ),
          BigInt(Math.max(0, deliveryCharge)),
          BigInt(orderData.total),
          orderData.paymentMethod,
          orderData.transactionId,
        );
      } catch {
        // Silently fail — order already stored locally
      }
    }
  };

  // ── Cancel order ────────────────────────────────────────────
  const handleCancelOrder = async (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "Cancelled", cancelledAt: Date.now() }
          : o,
      ),
    );
    toast.success("Order cancelled successfully.");
    if (actor) {
      try {
        await actor.cancelOrder(BigInt(orderId));
      } catch {
        // Silently fail
      }
    }
  };

  // ── Newsletter ──────────────────────────────────────────────
  const handleSubscribe = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("You're on the list! Welcome to Ghaza Fashion.");
    setEmail("");
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Render alternate views ──────────────────────────────────
  if (view === "help") {
    return (
      <HelpCentre
        onBack={() => setView("shop")}
        onMessages={() => setView("messages")}
      />
    );
  }

  if (view === "messages") {
    return <MessageCentre onBack={() => setView("shop")} />;
  }

  if (view === "checkout") {
    return (
      <>
        <Toaster />
        <CheckoutPage
          cartItems={cartItems}
          cartSubtotal={cartSubtotal}
          onPlaceOrder={handlePlaceOrder}
          onBack={() => setView("shop")}
        />
      </>
    );
  }

  if (view === "orders") {
    return (
      <>
        <Toaster />
        <OrdersPage
          orders={orders}
          onBack={() => setView("shop")}
          onCancelOrder={handleCancelOrder}
        />
      </>
    );
  }

  if (view === "admin") {
    return (
      <>
        <Toaster />
        <AdminPanel onBack={() => setView("shop")} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />

      {/* ── Navigation ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <span className="font-display font-brand text-2xl font-bold tracking-widest-xl uppercase shrink-0">
            Ghaza Fashion
          </span>

          {/* Search bar (expands inline) */}
          {searchOpen && (
            <div className="flex-1 max-w-sm flex items-center border-b border-foreground">
              <Search
                size={14}
                className="text-muted-foreground shrink-0 mr-2"
              />
              <input
                data-ocid="nav.search_input"
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent font-sans text-sm py-1 outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchTerm("");
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <ul className="hidden md:flex items-center gap-10">
            <li>
              <button
                type="button"
                data-ocid="nav.collections.link"
                onClick={() => scrollTo("collections")}
                className="text-sm font-sans tracking-editorial uppercase text-foreground hover:opacity-60 transition-opacity"
              >
                Collections
              </button>
            </li>
            <li>
              <button
                type="button"
                data-ocid="nav.about.link"
                onClick={() => scrollTo("about")}
                className="text-sm font-sans tracking-editorial uppercase text-foreground hover:opacity-60 transition-opacity"
              >
                About
              </button>
            </li>
            <li>
              <button
                type="button"
                data-ocid="nav.contact.link"
                onClick={() => setView("help")}
                className="text-sm font-sans tracking-editorial uppercase text-foreground hover:opacity-60 transition-opacity"
              >
                Contact
              </button>
            </li>
            <li>
              <button
                type="button"
                data-ocid="nav.orders.link"
                onClick={() => {
                  setCartOpen(false);
                  setView("orders");
                }}
                className="text-sm font-sans tracking-editorial uppercase text-foreground hover:opacity-60 transition-opacity flex items-center gap-1.5"
              >
                <Package size={14} />
                My Orders
              </button>
            </li>
          </ul>
          <div className="flex items-center gap-2">
            {/* Search icon */}
            <button
              type="button"
              data-ocid="nav.search_input"
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearchTerm("");
              }}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>

            {/* My Orders icon */}
            <button
              type="button"
              data-ocid="nav.orders.button"
              onClick={() => {
                setCartOpen(false);
                setView("orders");
              }}
              className="relative p-2 hover:opacity-60 transition-opacity flex flex-col items-center"
              aria-label="My Orders"
            >
              <Package size={22} />
              {orders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {orders.length}
                </span>
              )}
              <span className="text-[9px] font-sans uppercase tracking-wider text-muted-foreground leading-none mt-0.5">
                Orders
              </span>
            </button>

            {/* Cart icon */}
            <button
              type="button"
              data-ocid="cart.open_modal_button"
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:opacity-60 transition-opacity flex flex-col items-center"
              aria-label="Open cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-sans font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
              <span className="text-[9px] font-sans uppercase tracking-wider text-muted-foreground leading-none mt-0.5">
                Cart
              </span>
            </button>

            <button
              type="button"
              data-ocid="nav.shop_now.button"
              onClick={() => scrollTo("collections")}
              className="hidden sm:block text-sm font-sans tracking-editorial uppercase border border-foreground px-5 py-2 hover:bg-foreground hover:text-background transition-colors"
            >
              Shop Now
            </button>
          </div>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[80vh]">
          <div className="flex flex-col justify-center px-12 md:px-20 py-24 bg-background">
            <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-6 animate-fade-up">
              Spring / Summer 2026
            </p>
            <h1
              className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-8 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              Dress
              <br />
              <em className="not-italic text-muted-foreground">With</em>
              <br />
              Intention.
            </h1>
            <p
              className="text-base font-sans text-muted-foreground max-w-sm mb-10 leading-relaxed animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              Curated essentials for the modern woman — clean lines, refined
              fabrics, effortless confidence.
            </p>
            <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button
                data-ocid="hero.primary_button"
                onClick={() => scrollTo("collections")}
                className="bg-foreground text-background hover:bg-foreground/80 rounded-none px-10 py-6 text-sm tracking-editorial uppercase font-sans font-medium transition-all"
              >
                Shop Now
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden min-h-[50vh] md:min-h-0">
            <img
              src="/assets/generated/hero-fashion.dim_1200x700.jpg"
              alt="Ghaza Fashion Hero"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* ── Collections / Product Grid ─────────────────────── */}
      <section id="collections" className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-14 text-center">
          <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-3">
            Our
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Collections
          </h2>
          <div className="mt-8 flex justify-center">
            <img
              src="/assets/generated/helpcentre-ghaza-wall.dim_900x500.jpg"
              alt="Ghaza Fashion desi clothes hanging"
              className="w-full max-w-2xl rounded-sm object-cover shadow-md"
              style={{ maxHeight: "380px", objectFit: "cover" }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-0 mb-12 border-b border-border">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              data-ocid="filter.tab"
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 text-sm font-sans tracking-editorial uppercase transition-all relative ${
                activeCategory === cat
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div data-ocid="product.empty_state" className="text-center py-20">
            <p className="font-sans text-muted-foreground">
              No products found for &ldquo;{searchTerm}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                type="button"
                data-ocid={`product.item.${index + 1}`}
                className="group cursor-pointer text-left w-full"
                onClick={() => openProduct(product)}
                aria-label={`View ${product.name}`}
              >
                <div className="relative overflow-hidden aspect-[4/5] mb-4 bg-secondary">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
                  <div className="absolute inset-x-0 bottom-0 py-3 bg-foreground/90 text-background text-xs font-sans tracking-editorial uppercase text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Quick View
                  </div>
                  {product.originalPrice && (
                    <Badge className="absolute top-3 left-3 bg-foreground text-background rounded-none text-xs tracking-editorial uppercase font-sans">
                      Eid Sale
                    </Badge>
                  )}
                  {product.category === "New Arrivals" && (
                    <Badge className="absolute top-3 left-3 bg-background text-foreground border border-foreground rounded-none text-xs tracking-editorial uppercase font-sans">
                      New
                    </Badge>
                  )}
                  {product.soldOut && (
                    <Badge className="absolute top-3 left-3 bg-red-600 text-white rounded-none text-xs tracking-editorial uppercase font-sans">
                      Sold Out
                    </Badge>
                  )}
                  <button
                    type="button"
                    data-ocid={`product.toggle.${index + 1}`}
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                    aria-label={
                      wishlist.has(product.id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                  >
                    <Heart
                      size={14}
                      className={
                        wishlist.has(product.id)
                          ? "fill-red-500 text-red-500"
                          : "text-foreground"
                      }
                    />
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs tracking-editorial uppercase text-muted-foreground font-sans">
                    {product.category}
                  </p>
                  <h3 className="font-display text-base font-medium leading-tight">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-medium">
                      {product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="font-sans text-sm text-muted-foreground line-through">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── About ─────────────────────────────────────────── */}
      <section id="about" className="bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-6">
              Our Story
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-8">
              Made for the
              <br />
              <em className="font-display not-italic text-muted-foreground">
                Modern
              </em>{" "}
              Woman.
            </h2>
            <p className="font-sans text-base leading-relaxed text-muted-foreground mb-6">
              Ghaza Fashion was born from a simple belief: every woman deserves
              clothing that feels as powerful as she is. We source only the
              finest natural fabrics — silk, cashmere, organic cotton — and work
              with artisan workshops to craft pieces built to last.
            </p>
            <p className="font-sans text-base leading-relaxed text-muted-foreground mb-10">
              Our collections are designed to work together, season after season
              — building a wardrobe that&apos;s intentional, versatile, and
              unmistakably yours.
            </p>
            <button
              type="button"
              data-ocid="about.learn_more.button"
              onClick={() => scrollTo("collections")}
              className="text-sm font-sans tracking-editorial uppercase underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              Explore Collections
            </button>
          </div>
          <div className="relative">
            <div className="aspect-[3/4] bg-border overflow-hidden">
              <img
                src="/assets/generated/hero-fashion.dim_1200x700.jpg"
                alt="About Ghaza Fashion"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-foreground flex items-center justify-center">
              <span className="font-display text-background text-xs tracking-widest-xl uppercase text-center leading-loose">
                Est.
                <br />
                2020
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────── */}
      <section
        id="newsletter"
        className="max-w-7xl mx-auto px-6 py-24 text-center"
      >
        <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-4">
          Stay in the Loop
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
          Join the Inner Circle
        </h2>
        <p className="font-sans text-base text-muted-foreground max-w-md mx-auto mb-10">
          Early access to new collections, exclusive events, and style
          dispatches — for those who know.
        </p>
        <div className="flex max-w-md mx-auto gap-0">
          <Input
            data-ocid="newsletter.email_input"
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
            className="flex-1 rounded-none border-border bg-background focus-visible:ring-foreground font-sans text-sm h-12"
          />
          <Button
            type="button"
            data-ocid="newsletter.submit_button"
            onClick={handleSubscribe}
            className="rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm px-8 h-12 shrink-0"
          >
            Subscribe
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <p className="font-display font-brand text-2xl font-bold tracking-widest-xl uppercase mb-4">
                Ghaza Fashion
              </p>
              <p className="font-sans text-sm text-background/60 leading-relaxed max-w-xs">
                Curated women&apos;s clothing rooted in craft, quality, and
                effortless style.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://instagram.com"
                  data-ocid="footer.instagram.link"
                  className="text-background/60 hover:text-background transition-colors"
                  aria-label="Instagram"
                >
                  <SiInstagram size={18} />
                </a>
                <a
                  href="https://pinterest.com"
                  data-ocid="footer.pinterest.link"
                  className="text-background/60 hover:text-background transition-colors"
                  aria-label="Pinterest"
                >
                  <SiPinterest size={18} />
                </a>
              </div>
            </div>
            <div>
              <p className="font-sans text-xs tracking-widest-xl uppercase text-background/40 mb-5">
                Navigate
              </p>
              <ul className="space-y-3">
                {[
                  { label: "Collections", id: "collections" },
                  { label: "About Us", id: "about" },
                  { label: "Contact", id: "help" },
                  { label: "Message Us", id: "messages" },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        item.id === "help"
                          ? setView("help")
                          : item.id === "messages"
                            ? setView("messages")
                            : scrollTo(item.id)
                      }
                      className="font-sans text-sm text-background/60 hover:text-background transition-colors tracking-editorial uppercase"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setView("orders")}
                    className="font-sans text-sm text-background/60 hover:text-background transition-colors tracking-editorial uppercase"
                  >
                    My Orders
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    data-ocid="footer.help.button"
                    onClick={() => setView("help")}
                    className="font-sans text-sm text-background/60 hover:text-background transition-colors tracking-editorial uppercase"
                  >
                    Help Centre
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-sans text-xs tracking-widest-xl uppercase text-background/40 mb-5">
                Customer Care
              </p>
              <ul className="space-y-3">
                <li>
                  <p className="font-sans text-sm text-background/60">
                    JazzCash:{" "}
                    <span className="text-background">0320-1435872</span>
                  </p>
                </li>
                <li>
                  <p className="font-sans text-sm text-background/60">
                    EasyPaisa:{" "}
                    <span className="text-background">0320-1435872</span>
                  </p>
                </li>
                <li>
                  <p className="font-sans text-sm text-background/60">
                    Meezan Bank:{" "}
                    <span className="text-background">02820108082003</span>
                  </p>
                </li>
                <li>
                  <p className="font-sans text-sm text-background/60">
                    Mon–Sat, 10am–8pm
                  </p>
                </li>
                <li>
                  <p className="font-sans text-sm text-background/60">
                    Orders cancelled within{" "}
                    <span className="text-background">4 hours</span> of
                    placement.
                  </p>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="bg-background/10 mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-sans text-xs text-background/40">
              © {new Date().getFullYear()} Ghaza Fashion. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs text-background/40 hover:text-background/70 transition-colors"
              >
                Built with love using caffeine.ai
              </a>
              <button
                type="button"
                data-ocid="admin.open_modal_button"
                onClick={() => setShowAdminPasswordModal(true)}
                className="font-sans text-xs text-background/20 hover:text-background/50 transition-colors"
              >
                Admin
              </button>

              {/* Admin Password Modal */}
              <Dialog
                open={showAdminPasswordModal}
                onOpenChange={(open) => {
                  setShowAdminPasswordModal(open);
                  if (!open) {
                    setAdminPassword("");
                    setAdminPasswordError("");
                  }
                }}
              >
                <DialogContent
                  data-ocid="admin.password_modal"
                  className="sm:max-w-sm"
                >
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Admin Access</h2>
                    <p className="text-sm text-muted-foreground">
                      Enter the admin password to continue.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        data-ocid="admin.password_input"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setAdminPasswordError("");
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAdminPasswordSubmit()
                        }
                        placeholder="Enter password"
                      />
                      {adminPasswordError && (
                        <p
                          className="text-sm text-destructive"
                          data-ocid="admin.password.error_state"
                        >
                          {adminPasswordError}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAdminPasswordModal(false);
                          setAdminPassword("");
                          setAdminPasswordError("");
                        }}
                        data-ocid="admin.password.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAdminPasswordSubmit}
                        data-ocid="admin.password_submit"
                      >
                        Enter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════
          PRODUCT DETAIL MODAL
      ══════════════════════════════════════════════════════ */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && closeProduct()}
      >
        <DialogContent
          className="max-w-4xl w-full p-0 gap-0 rounded-none border-border overflow-hidden"
          showCloseButton={false}
        >
          {selectedProduct && (
            <div className="grid md:grid-cols-2 min-h-[560px]">
              {/* Left: image */}
              <div className="relative bg-secondary overflow-hidden">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {selectedProduct.originalPrice && (
                  <Badge className="absolute top-4 left-4 bg-foreground text-background rounded-none text-xs tracking-editorial uppercase font-sans">
                    Eid Sale
                  </Badge>
                )}
              </div>

              {/* Right: details */}
              <div className="flex flex-col justify-between p-8 md:p-10 bg-background relative">
                <button
                  type="button"
                  data-ocid="product.modal.close_button"
                  onClick={closeProduct}
                  className="absolute top-5 right-5 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs tracking-widest-xl uppercase text-muted-foreground mb-2 font-sans">
                      {selectedProduct.category}
                    </p>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight pr-8">
                        {selectedProduct.name}
                      </h2>
                      <button
                        type="button"
                        data-ocid="product.modal.toggle"
                        onClick={() => toggleWishlist(selectedProduct.id)}
                        className="shrink-0 p-2 border border-border hover:border-foreground transition-colors mt-0.5"
                        aria-label={
                          wishlist.has(selectedProduct.id)
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        <Heart
                          size={18}
                          className={
                            wishlist.has(selectedProduct.id)
                              ? "fill-red-500 text-red-500"
                              : "text-foreground"
                          }
                        />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-3 mt-3">
                      <span className="font-display text-2xl font-bold">
                        {selectedProduct.price}
                      </span>
                      {selectedProduct.originalPrice && (
                        <span className="font-sans text-base text-muted-foreground line-through">
                          {selectedProduct.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="bg-secondary px-4 py-3 flex items-center gap-2">
                    <Truck
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                    <p className="font-sans text-xs text-muted-foreground">
                      {parsePrice(selectedProduct.price) >
                      FREE_DELIVERY_THRESHOLD
                        ? "FREE delivery on this item!"
                        : `Add RS:${
                            FREE_DELIVERY_THRESHOLD -
                            parsePrice(selectedProduct.price) +
                            1
                          } more for free delivery`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs tracking-widest-xl uppercase font-sans text-muted-foreground">
                      Quantity
                    </p>
                    <div className="inline-flex items-center border border-border">
                      <button
                        type="button"
                        data-ocid="product.modal.secondary_button"
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-sans text-sm font-medium">
                        {modalQty}
                      </span>
                      <button
                        type="button"
                        data-ocid="product.modal.primary_button"
                        onClick={() => setModalQty((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {selectedProduct?.soldOut ? (
                    <div className="w-full rounded-none bg-gray-200 text-gray-500 font-sans tracking-editorial uppercase text-sm py-4 text-center border border-gray-300">
                      Sold Out
                    </div>
                  ) : (
                    <>
                      <Button
                        data-ocid="product.modal.submit_button"
                        onClick={handleAddToCart}
                        className="w-full rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm py-6"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        data-ocid="product.modal.confirm_button"
                        onClick={handleBuyNow}
                        variant="outline"
                        className="w-full rounded-none border-foreground font-sans tracking-editorial uppercase text-sm py-6 hover:bg-foreground hover:text-background"
                      >
                        Buy Now
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          CART SHEET
      ══════════════════════════════════════════════════════ */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          data-ocid="cart.sheet"
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col rounded-none border-border"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="font-display text-xl font-bold tracking-widest-xl uppercase flex items-center gap-2">
              <ShoppingBag size={18} />
              Your Cart
              {cartCount > 0 && (
                <span className="ml-auto font-sans text-sm font-medium text-muted-foreground">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {cartItems.length === 0 ? (
            <div
              data-ocid="cart.empty_state"
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6"
            >
              <ShoppingBag
                size={48}
                className="text-border"
                strokeWidth={1.5}
              />
              <div>
                <p className="font-display text-lg font-semibold mb-1">
                  Your cart is empty
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  Add items to get started.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-5">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-secondary shrink-0 overflow-hidden">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-sans text-sm font-medium leading-snug">
                          {item.product.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="font-sans text-sm font-semibold mt-1">
                        {formatPrice(
                          parsePrice(item.product.price) * item.quantity,
                        )}
                      </p>
                      <div className="inline-flex items-center border border-border mt-2">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center font-sans text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="Increase"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {cartItems.length > 0 && (
            <div className="px-6 pt-4 pb-6 border-t border-border space-y-4">
              {/* Free delivery progress */}
              {cartSubtotal <= FREE_DELIVERY_THRESHOLD && (
                <div className="space-y-1.5">
                  <p className="font-sans text-xs text-muted-foreground">
                    Add{" "}
                    <span className="font-semibold text-foreground">
                      {formatPrice(FREE_DELIVERY_THRESHOLD - cartSubtotal + 1)}
                    </span>{" "}
                    more for free delivery
                  </p>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {cartSubtotal > FREE_DELIVERY_THRESHOLD && (
                <p className="font-sans text-xs font-semibold text-green-600">
                  🎉 You qualify for FREE delivery!
                </p>
              )}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="font-sans text-xs text-muted-foreground">
                    Subtotal
                  </p>
                  <p className="font-sans text-sm font-medium">
                    {formatPrice(cartSubtotal)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                    <Truck size={11} /> Delivery
                  </p>
                  {cartDeliveryCharge === 0 ? (
                    <p className="font-sans text-xs font-semibold text-green-600">
                      FREE
                    </p>
                  ) : (
                    <p className="font-sans text-sm">
                      {formatPrice(DELIVERY_CHARGE)}
                    </p>
                  )}
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between items-center">
                  <p className="font-display text-base font-bold">Total</p>
                  <p className="font-display text-lg font-bold">
                    {formatPrice(cartGrandTotal)}
                  </p>
                </div>
              </div>
              <Button
                data-ocid="cart.checkout_button"
                onClick={() => {
                  setCartOpen(false);
                  setView("checkout");
                }}
                className="w-full rounded-none bg-foreground text-background hover:bg-foreground/80 font-sans tracking-editorial uppercase text-sm py-6"
              >
                Checkout · {formatPrice(cartGrandTotal)}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
