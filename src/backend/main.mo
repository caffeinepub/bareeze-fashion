import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  public type OrderItem = {
    productId : Nat;
    productName : Text;
    price : Nat;
    quantity : Nat;
  };

  public type Order = {
    id : Nat;
    customerName : Text;
    phone : Text;
    email : Text;
    address : Text;
    city : Text;
    items : [OrderItem];
    subtotal : Nat;
    deliveryCharge : Nat;
    total : Nat;
    paymentMethod : Text;
    transactionId : Text;
    status : Text;
    orderedAt : Int;
    cancelledAt : ?Int;
    createdBy : ?Principal;
  };

  public type UserProfile = {
    name : Text;
  };

  public type Product = {
    id : Nat;
    name : Text;
    price : Nat;
    originalPrice : ?Nat;
    image : Text;
    category : Text;
    description : Text;
    soldOut : Bool;
    saleBadge : Text;
  };

  // Access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Orders storage
  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 1;

  // User profiles storage
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Products storage
  let products = Map.empty<Nat, Product>();
  var nextProductId = 1;

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product management functions
  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  public shared ({ caller }) func saveProduct(
    id : Nat,
    name : Text,
    price : Nat,
    originalPrice : ?Nat,
    image : Text,
    category : Text,
    description : Text,
    soldOut : Bool,
    saleBadge : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can save products");
    };
    let productId = if (id == 0) {
      let newId = nextProductId;
      nextProductId += 1;
      newId;
    } else {
      id;
    };
    let product : Product = {
      id = productId;
      name;
      price;
      originalPrice;
      image;
      category;
      description;
      soldOut;
      saleBadge;
    };
    products.add(productId, product);
    productId;
  };

  public shared ({ caller }) func deleteProduct(productId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    ignore products.remove(productId);
  };

  public shared ({ caller }) func saveAllProducts(productList : [Product]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can save products");
    };
    // Clear existing products
    for ((k, _) in products.entries()) {
      ignore products.remove(k);
    };
    // Save all new products
    var maxId = 0;
    for (p in productList.vals()) {
      products.add(p.id, p);
      if (p.id > maxId) { maxId := p.id };
    };
    nextProductId := maxId + 1;
  };

  // Order management functions
  public shared ({ caller }) func placeOrder(
    customerName : Text,
    phone : Text,
    email : Text,
    address : Text,
    city : Text,
    items : [OrderItem],
    subtotal : Nat,
    deliveryCharge : Nat,
    total : Nat,
    paymentMethod : Text,
    transactionId : Text,
  ) : async Nat {
    let orderId = nextOrderId;
    nextOrderId += 1;

    let order : Order = {
      id = orderId;
      customerName;
      phone;
      email;
      address;
      city;
      items;
      subtotal;
      deliveryCharge;
      total;
      paymentMethod;
      transactionId;
      status = "Processing";
      orderedAt = Time.now();
      cancelledAt = null;
      createdBy = ?caller;
    };

    orders.add(orderId, order);
    orderId;
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their orders");
    };
    
    let iter = orders.values().filter(
      func(order) {
        switch (order.createdBy) {
          case (?creator) { creator == caller };
          case (null) { false };
        };
      }
    );
    iter.toArray();
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(
    orderId : Nat,
    newStatus : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (null) {
        Runtime.trap("Order not found");
      };
      case (?order) {
        let updatedOrder : Order = {
          order with status = newStatus
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func cancelOrder(orderId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can cancel orders");
    };

    switch (orders.get(orderId)) {
      case (null) {
        Runtime.trap("Order not found");
      };
      case (?order) {
        // Check ownership
        switch (order.createdBy) {
          case (?creator) {
            if (creator != caller) {
              Runtime.trap("Unauthorized: Cannot cancel another user's order");
            };
          };
          case (null) {
            Runtime.trap("Unauthorized: Cannot cancel order");
          };
        };

        // Check status
        if (order.status != "Processing" and order.status != "Shipped") {
          Runtime.trap("Cannot cancel order with status: " # order.status);
        };

        // Check time window (4 hours in nanoseconds)
        let timeDiff = Time.now() - order.orderedAt;
        if (timeDiff > 4 * 60 * 60 * 1000000000) {
          Runtime.trap("Cancellation period expired");
        };

        let updatedOrder : Order = {
          order with
          status = "Cancelled";
          cancelledAt = ?Time.now();
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrderById(orderId : Nat) : async ?Order {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        // Admin can view any order
        if (AccessControl.isAdmin(accessControlState, caller)) {
          return ?order;
        };

        // Users can only view their own orders
        switch (order.createdBy) {
          case (?creator) {
            if (creator == caller) {
              ?order;
            } else {
              Runtime.trap("Unauthorized: Cannot view another user's order");
            };
          };
          case (null) {
            Runtime.trap("Unauthorized: Cannot view this order");
          };
        };
      };
    };
  };
};
