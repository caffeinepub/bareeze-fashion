import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    deliveryCharge: bigint;
    total: bigint;
    paymentMethod: string;
    city: string;
    createdBy?: Principal;
    email: string;
    orderedAt: bigint;
    cancelledAt?: bigint;
    address: string;
    phone: string;
    items: Array<OrderItem>;
    subtotal: bigint;
    transactionId: string;
}
export interface UserProfile {
    name: string;
}
export interface OrderItem {
    productId: bigint;
    productName: string;
    quantity: bigint;
    price: bigint;
}
export interface BackendProduct {
    id: bigint;
    name: string;
    price: bigint;
    originalPrice?: bigint;
    image: string;
    category: string;
    description: string;
    soldOut: boolean;
    saleBadge: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelOrder(orderId: bigint): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyOrders(): Promise<Array<Order>>;
    getOrderById(orderId: bigint): Promise<Order | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, phone: string, email: string, address: string, city: string, items: Array<OrderItem>, subtotal: bigint, deliveryCharge: bigint, total: bigint, paymentMethod: string, transactionId: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderStatus(orderId: bigint, newStatus: string): Promise<void>;
    getProducts(): Promise<Array<BackendProduct>>;
    saveProduct(id: bigint, name: string, price: bigint, originalPrice: bigint | null, image: string, category: string, description: string, soldOut: boolean, saleBadge: string): Promise<bigint>;
    deleteProduct(productId: bigint): Promise<void>;
    saveAllProducts(productList: Array<BackendProduct>): Promise<void>;
}
