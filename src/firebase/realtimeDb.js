import { ref, set, onValue, serverTimestamp } from "firebase/database";
import { rtdb } from "./config";

// Active Orders Status Sync
export const syncOrderStatus = (orderId, status) => {
  return set(ref(rtdb, `activeOrders/${orderId}`), {
    status,
    updatedAt: serverTimestamp()
  });
};

export const subscribeToActiveOrders = (callback) => {
  const activeOrdersRef = ref(rtdb, 'activeOrders');
  return onValue(activeOrdersRef, (snapshot) => {
    callback(snapshot.val());
  });
};

// Cart Sync
export const syncCart = (uid, items) => {
  if (!uid) return;
  return set(ref(rtdb, `cartSync/${uid}`), {
    items,
    updatedAt: serverTimestamp()
  });
};

export const subscribeToCartSync = (uid, callback) => {
  if (!uid) return;
  const cartRef = ref(rtdb, `cartSync/${uid}`);
  return onValue(cartRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ? data.items : []);
  });
};
