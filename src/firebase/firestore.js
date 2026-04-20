import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  setDoc,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { db } from "./config";

// Users
export const getUserProfile = async (uid) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const createUserProfile = async (uid, data) => {
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);
  
  if (!userDocSnap.exists()) {
    await setDoc(userDocRef, {
      ...data,
      role: 'admin', // Default to admin for bootstrapping the system
      createdAt: serverTimestamp()
    });
    return { ...data, role: 'admin' };
  }
  return userDocSnap.data();
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), data);
};

export const subscribeToUsers = (callback) => {
  const q = query(collection(db, "users"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const deleteUserDoc = (uid) => {
  return deleteDoc(doc(db, "users", uid));
};

// Products
export const getProducts = async () => {
  const q = query(collection(db, "products"), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToProducts = (callback) => {
  const q = query(collection(db, "products"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  });
};

export const addProduct = (data) => {
  return addDoc(collection(db, "products"), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateProduct = (id, data) => {
  return updateDoc(doc(db, "products", id), data);
};

export const deleteProduct = (id) => {
  return deleteDoc(doc(db, "products", id));
};

// Orders
export const addOrder = (data) => {
  return addDoc(collection(db, "orders"), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const getOrders = async () => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToOrders = (callback) => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
};

export const updateOrder = (id, data) => {
  return updateDoc(doc(db, "orders", id), data);
};

export { db };

// Global Settings
export const getGlobalSettings = async () => {
  try {
    const docRef = doc(db, "settings", "config");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : { taxRate: 8, shopName: "SmartPOS" };
  } catch {
    console.warn("Global settings not found or access denied, using defaults.");
    return { taxRate: 8, shopName: "SmartPOS" };
  }
};

export const updateGlobalSettings = async (data) => {
  const docRef = doc(db, "settings", "config");
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getUserCount = async () => {
  const q = query(collection(db, "users"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

// Barcode Lookup
export const getProductByBarcode = async (barcode) => {
  const q = query(collection(db, "products"));
  const querySnapshot = await getDocs(q);
  const match = querySnapshot.docs.find(d => d.data().barcode === barcode);
  return match ? { id: match.id, ...match.data() } : null;
};

// Customers
export const addCustomer = (data) => {
  return addDoc(collection(db, "customers"), {
    ...data,
    loyaltyPoints: data.loyaltyPoints || 0,
    createdAt: serverTimestamp()
  });
};

export const getCustomers = async () => {
  const q = query(collection(db, "customers"), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subscribeToCustomers = (callback) => {
  const q = query(collection(db, "customers"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(customers);
  });
};

export const getCustomerByPhone = async (phone) => {
  const q = query(collection(db, "customers"));
  const querySnapshot = await getDocs(q);
  const match = querySnapshot.docs.find(d => d.data().phone === phone);
  return match ? { id: match.id, ...match.data() } : null;
};

export const updateCustomer = (id, data) => {
  return updateDoc(doc(db, "customers", id), data);
};

export const deleteCustomer = (id) => {
  return deleteDoc(doc(db, "customers", id));
};

export const updateCustomerLoyaltyPoints = (customerId, pointsToAdd) => {
  return updateDoc(doc(db, "customers", customerId), { 
    loyaltyPoints: increment(pointsToAdd) 
  });
};

export const decrementProductStock = (id, quantity) => {
  return updateDoc(doc(db, "products", id), {
    stock: increment(-quantity)
  });
};
