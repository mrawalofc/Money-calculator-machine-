import { useState, useEffect, useMemo } from 'react';
import { Transaction, UserSettings, Category, Budget, CONVERSION_RATES, SUPPORTED_CURRENCIES } from '../types';
import * as XLSX from 'xlsx';
import { subMonths, format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { db, auth, isFirebaseReady, testConnection } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// Extend jsPDF with autotable types for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  deleteDoc, 
  CollectionReference,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const TRANSACTIONS_KEY = 'aurelius_transactions';
const SETTINGS_KEY = 'aurelius_settings';
const BUDGETS_KEY = 'aurelius_budgets';

export function useExpenses() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === 'undefined') return [];
    const local = localStorage.getItem(TRANSACTIONS_KEY);
    try {
      return local ? JSON.parse(local) : [];
    } catch (e) {
      console.error("Failed to parse local transactions", e);
      return [];
    }
  });
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    if (typeof window === 'undefined') return [];
    const local = localStorage.getItem(BUDGETS_KEY);
    try {
      return local ? JSON.parse(local) : [];
    } catch (e) {
      console.error("Failed to parse local budgets", e);
      return [];
    }
  });
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Try to load initial settings from localStorage for instant boot
    const localSettings = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    if (localSettings) {
      try {
        return JSON.parse(localSettings);
      } catch (e) {
        console.error("Failed to parse local settings", e);
      }
    }
    return {
      name: 'Guest User',
      currency: 'USD',
      darkMode: true,
      avatarUrl: '',
      language: 'en',
      multiColorMode: true
    };
  });

  const [lastDeleted, setLastDeleted] = useState<Transaction[] | null>(null);
  const [isTransactionsSyncing, setIsTransactionsSyncing] = useState(false);
  const [isBudgetsSyncing, setIsBudgetsSyncing] = useState(false);
  const [isSettingsSyncing, setIsSettingsSyncing] = useState(false);
  
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [lastCloudSync, setLastCloudSync] = useState<number | null>(() => {
    const local = typeof window !== 'undefined' ? localStorage.getItem('aurelius_last_cloud_sync') : null;
    return local ? parseInt(local) : null;
  });

  const isCloudSyncing = isTransactionsSyncing || isBudgetsSyncing || isSettingsSyncing;
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [lastDriveSync, setLastDriveSync] = useState<number | null>(() => {
    const local = typeof window !== 'undefined' ? localStorage.getItem('aurelius_last_drive_sync') : null;
    return local ? parseInt(local) : null;
  });
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (lastDriveSync) {
      localStorage.setItem('aurelius_last_drive_sync', lastDriveSync.toString());
    }
  }, [lastDriveSync]);

  useEffect(() => {
    if (lastCloudSync) {
      localStorage.setItem('aurelius_last_cloud_sync', lastCloudSync.toString());
    }
  }, [lastCloudSync]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncToGoogleDrive = async (token: string) => {
    if (!token) return;
    setIsDriveSyncing(true);
    try {
      const backupData = {
        app: "Aurelius Finance",
        timestamp: new Date().toISOString(),
        transactions,
        settings,
        budgets
      };

      // 1. Search for existing file
      const searchRes = await fetch('https://www.googleapis.com/drive/v3/files?q=name="aurelius_backup.json"&spaces=drive', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      const existingFile = searchData.files?.[0];

      const metadata = {
        name: 'aurelius_backup.json',
        mimeType: 'application/json'
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', new Blob([JSON.stringify(backupData)], { type: 'application/json' }));

      if (existingFile) {
        // Update existing
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      } else {
        // Create new
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      setLastDriveSync(Date.now());
      console.log('Google Drive sync successful');
    } catch (error) {
      console.error('Google Drive sync failed:', error);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const convertAmount = (amount: number, from: string, to: string) => {
    if (from === to) return amount;
    const rateFrom = CONVERSION_RATES[from] || 1;
    const rateTo = CONVERSION_RATES[to] || 1;
    return (amount / rateFrom) * rateTo;
  };

  // Monitor Auth State
  useEffect(() => {
    if (!isFirebaseReady()) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    
    // Test connection on boot
    testConnection();
    
    return () => unsubscribe();
  }, []);

  // Sync Transactions with Firestore
  useEffect(() => {
    if (!user || !isFirebaseReady()) {
      setIsTransactionsSyncing(false);
      return;
    }

    setIsTransactionsSyncing(true);
    const path = `users/${user.uid}/transactions`;
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const cloudTransactions = snapshot.docs.map(doc => doc.data() as Transaction);
      
      // Initial migration: If cloud is empty but local has data, upload local data
      if (snapshot.empty && transactions.length > 0 && !snapshot.metadata.hasPendingWrites) {
        console.log("Migrating local transactions to cloud...");
        const batch = writeBatch(db);
        transactions.forEach(t => {
          batch.set(doc(db, 'users', user.uid, 'transactions', t.id), cleanData({
            ...t,
            userId: user.uid
          }));
        });
        batch.commit().catch(err => console.error("Migration error:", err));
      } else {
        setTransactions(cloudTransactions);
      }
      
      setIsTransactionsSyncing(snapshot.metadata.fromCache);
      setHasPendingWrites(snapshot.metadata.hasPendingWrites);
      if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
        setLastCloudSync(Date.now());
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, path);
      }
      console.error("Firestore transaction sync error:", error);
      setIsTransactionsSyncing(false);
      setHasPendingWrites(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Budgets with Firestore
  useEffect(() => {
    if (!user || !isFirebaseReady()) {
      setIsBudgetsSyncing(false);
      return;
    }

    setIsBudgetsSyncing(true);
    const path = `users/${user.uid}/budgets`;
    const q = collection(db, 'users', user.uid, 'budgets');
    
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const cloudBudgets = snapshot.docs.map(doc => doc.data() as Budget);
      
      // Initial migration: If cloud is empty but local has data, upload local data
      if (snapshot.empty && budgets.length > 0 && !snapshot.metadata.hasPendingWrites) {
        console.log("Migrating local budgets to cloud...");
        const batch = writeBatch(db);
        budgets.forEach(b => {
          // Use category as doc ID as per updateBudget implementation
          batch.set(doc(db, 'users', user.uid, 'budgets', b.category), cleanData({
            ...b,
            userId: user.uid
          }));
        });
        batch.commit().catch(err => console.error("Budget migration error:", err));
      } else {
        setBudgets(cloudBudgets);
      }
      
      setIsBudgetsSyncing(snapshot.metadata.fromCache);
      setHasPendingWrites(snapshot.metadata.hasPendingWrites);
      if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
        setLastCloudSync(Date.now());
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, path);
      }
      console.error("Firestore budget sync error:", error);
      setIsBudgetsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Settings with Firestore
  useEffect(() => {
    if (!user || !isFirebaseReady()) {
      setIsSettingsSyncing(false);
      return;
    }

    setIsSettingsSyncing(true);
    const path = `users/${user.uid}/settings/current`;
    const settingsDoc = doc(db, 'users', user.uid, 'settings', 'current');
    
    const unsubscribe = onSnapshot(settingsDoc, { includeMetadataChanges: true }, (snapshot: any) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as UserSettings);
      } else if (!snapshot.metadata.hasPendingWrites && settings.name !== 'Guest User') {
        // Migration: If cloud settings don't exist but local settings have been customized
        console.log("Migrating local settings to cloud...");
        setDoc(settingsDoc, cleanData({ ...settings, userId: user.uid }), { merge: true })
          .catch(err => console.error("Settings migration error:", err));
      }
      
      setIsSettingsSyncing(snapshot.metadata.fromCache);
      setHasPendingWrites(snapshot.metadata.hasPendingWrites);
      if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
        setLastCloudSync(Date.now());
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, path);
      }
      console.error("Firestore settings sync error:", error);
      setIsSettingsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const cleanData = (data: any) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });
    return cleaned;
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const newTransaction: Transaction = {
      ...transaction,
      currency: transaction.currency || settings.currency,
      id,
      createdAt: Date.now()
    };

    if (user && isFirebaseReady()) {
      const path = `users/${user.uid}/transactions/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'transactions', id), cleanData({
          ...newTransaction,
          userId: user.uid
        }));
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
        console.error("Failed to add to cloud:", error);
      }
    } else {
      setTransactions(prev => [newTransaction, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    if (transactionToDelete) {
      setLastDeleted([transactionToDelete]);
      
      if (user && isFirebaseReady()) {
        const path = `users/${user.uid}/transactions/${id}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.DELETE, path);
          }
          console.error("Failed to delete from cloud:", error);
        }
      } else {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const deleteMultipleTransactions = async (ids: string[]) => {
    const transactionsToDelete = transactions.filter(t => ids.includes(t.id));
    if (transactionsToDelete.length > 0) {
      setLastDeleted(transactionsToDelete);
      
      if (user && isFirebaseReady()) {
        try {
          const batch = writeBatch(db);
          ids.forEach(id => {
            batch.delete(doc(db, 'users', user.uid, 'transactions', id));
          });
          await batch.commit();
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.WRITE, 'batch-delete');
          }
          console.error("Failed to batch delete from cloud:", error);
        }
      } else {
        setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      }
    }
  };

  const undoDelete = async () => {
    if (lastDeleted) {
      if (user && isFirebaseReady()) {
        try {
          const batch = writeBatch(db);
          lastDeleted.forEach(t => {
            batch.set(doc(db, 'users', user.uid, 'transactions', t.id), cleanData({
              ...t,
              userId: user.uid
            }));
          });
          await batch.commit();
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.WRITE, 'batch-restore');
          }
          console.error("Failed to undo delete in cloud:", error);
        }
      } else {
        setTransactions(prev => {
          const restored = [...lastDeleted, ...prev];
          return restored.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      }
      setLastDeleted(null);
    }
  };

  const clearLastDeleted = () => setLastDeleted(null);

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (user && isFirebaseReady()) {
      const path = `users/${user.uid}/transactions/${id}`;
      try {
        const transRef = doc(db, 'users', user.uid, 'transactions', id);
        await setDoc(transRef, cleanData(updates), { merge: true });
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
        console.error("Failed to update in cloud:", error);
      }
    } else {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const updateMultipleTransactions = async (ids: string[], updates: Partial<Transaction>) => {
    if (user && isFirebaseReady()) {
      try {
        const batch = writeBatch(db);
        ids.forEach(id => {
          const transRef = doc(db, 'users', user.uid, 'transactions', id);
          batch.set(transRef, cleanData(updates), { merge: true });
        });
        await batch.commit();
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.WRITE, 'batch-update');
        }
        console.error("Failed to bulk update in cloud:", error);
      }
    } else {
      setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
    }
  };

  const updateBudget = async (budget: Budget) => {
    if (user && isFirebaseReady()) {
      const path = `users/${user.uid}/budgets/${budget.category}`;
      try {
        // Use category name as document ID for simplicity and unique constraint per category
        const budgetRef = doc(db, 'users', user.uid, 'budgets', budget.category);
        await setDoc(budgetRef, cleanData({ ...budget, userId: user.uid }));
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
        console.error("Failed to update budget in cloud:", error);
      }
    } else {
      setBudgets(prev => {
        const index = prev.findIndex(b => b.category === budget.category);
        if (index >= 0) {
          const next = [...prev];
          next[index] = budget;
          return next;
        }
        return [...prev, budget];
      });
    }
  };

  const deleteBudget = async (category: Category) => {
    if (user && isFirebaseReady()) {
      const path = `users/${user.uid}/budgets/${category}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'budgets', category));
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
        console.error("Failed to delete budget in cloud:", error);
      }
    } else {
      setBudgets(prev => prev.filter(b => b.category !== category));
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (user && isFirebaseReady()) {
      const path = `users/${user.uid}/settings/current`;
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'current');
        await setDoc(settingsRef, cleanData({ ...updates, userId: user.uid }), { merge: true });
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
        console.error("Failed to update settings in cloud:", error);
      }
    } else {
      setSettings(prev => ({ ...prev, ...updates }));
    }
  };

  const summary = useMemo(() => {
    const realIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0);
    const realExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0);

    const lentTotal = transactions
      .filter(t => t.type === 'lent')
      .reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0) -
      transactions
      .filter(t => t.type === 'lent_repayment')
      .reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0);
    
    const borrowedTotal = transactions
      .filter(t => t.type === 'borrowed')
      .reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0) -
      transactions
      .filter(t => t.type === 'borrowed_repayment')
      .reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0);
    
    return {
      income: realIncome + transactions.filter(t => t.type === 'lent_repayment').reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0),
      expenses: realExpenses + transactions.filter(t => t.type === 'borrowed_repayment').reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0),
      lentTotal,
      borrowedTotal,
      balance: (realIncome + borrowedTotal + transactions.filter(t => t.type === 'lent_repayment').reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0)) - 
               (realExpenses + lentTotal + transactions.filter(t => t.type === 'borrowed_repayment').reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0)), // Actual cash on hand
      savings: (realIncome + transactions.filter(t => t.type === 'lent_repayment').reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0)) - 
               (realExpenses + transactions.filter(t => t.type === 'borrowed_repayment').reduce((acc, t) => acc + convertAmount(t.amount, t.currency || settings.currency, settings.currency), 0)) // Net growth
    };
  }, [transactions]);

  const lentPerPerson = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => (t.type === 'lent' || t.type === 'lent_repayment') && t.personName)
      .forEach(t => {
        const name = t.personName!;
        if (t.type === 'lent') {
          data[name] = (data[name] || 0) + t.amount;
        } else {
          data[name] = (data[name] || 0) - t.amount;
        }
      });
    return Object.entries(data)
      .map(([name, amount]) => ({ name, amount: Math.max(0, amount) }))
      .filter(p => p.amount > 0) // Remove if fully paid back
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const borrowedPerPerson = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => (t.type === 'borrowed' || t.type === 'borrowed_repayment') && t.personName)
      .forEach(t => {
        const name = t.personName!;
        if (t.type === 'borrowed') {
          data[name] = (data[name] || 0) + t.amount;
        } else {
          data[name] = (data[name] || 0) - t.amount;
        }
      });
    return Object.entries(data)
      .map(([name, amount]) => ({ name, amount: Math.max(0, amount) }))
      .filter(p => p.amount > 0) // Remove if fully paid back
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' || t.type === 'lent')
      .forEach(t => {
        const convertedAmount = convertAmount(t.amount, t.currency || settings.currency, settings.currency);
        data[t.category] = (data[t.category] || 0) + convertedAmount;
      });
    
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const spendingThisMonthPerCategory = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const data: Record<string, number> = {};
    transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return (t.type === 'expense' || t.type === 'lent') && 
               tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      })
      .forEach(t => {
        const converted = convertAmount(t.amount, t.currency || settings.currency, settings.currency);
        data[t.category] = (data[t.category] || 0) + converted;
      });
    
    return data as Record<Category, number>;
  }, [transactions]);

  const spendingPreviousMonthPerCategory = useMemo(() => {
    const now = new Date();
    const prevMonthDate = subMonths(now, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    const data: Record<string, number> = {};
    transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return (t.type === 'expense' || t.type === 'lent') && 
               tDate.getMonth() === prevMonth && 
               tDate.getFullYear() === prevYear;
      })
      .forEach(t => {
        const converted = convertAmount(t.amount, t.currency || settings.currency, settings.currency);
        data[t.category] = (data[t.category] || 0) + converted;
      });
    
    return data as Record<Category, number>;
  }, [transactions]);

  const historicalBudgetPerformance = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Check performance for last 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(now, i);
      const m = monthDate.getMonth();
      const y = monthDate.getFullYear();
      
      const monthSpending: Record<string, number> = {};
      transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return (t.type === 'expense' || t.type === 'lent') && 
                 tDate.getMonth() === m && 
                 tDate.getFullYear() === y;
        })
        .forEach(t => {
          const converted = convertAmount(t.amount, t.currency || settings.currency, settings.currency);
          monthSpending[t.category] = (monthSpending[t.category] || 0) + converted;
        });

      const performance = budgets.map(budget => {
        const spentInMain = monthSpending[budget.category] || 0;
        const budgetCurrency = budget.currency || settings.currency;
        const spentInBudgetCurrency = convertAmount(spentInMain, settings.currency, budgetCurrency);
        
        return {
          category: budget.category,
          limit: budget.limit,
          spent: spentInBudgetCurrency,
          currency: budgetCurrency,
          percent: budget.limit > 0 ? (spentInBudgetCurrency / budget.limit) * 100 : 0
        };
      }).filter(p => p.spent > 0 || i === 0); // Show everything for current month, only active for past

      months.push({
        label: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        performance,
        totalSpent: performance.reduce((acc, curr) => acc + convertAmount(curr.spent, curr.currency || settings.currency, settings.currency), 0),
        totalLimit: performance.reduce((acc, curr) => acc + convertAmount(curr.limit, curr.currency || settings.currency, settings.currency), 0)
      });
    }

    return months;
  }, [transactions, budgets]);

  const exportToExcel = (customTransactions?: Transaction[]) => {
    const listToExport = (customTransactions || transactions).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (listToExport.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(listToExport.map(t => ({
      Date: t.date,
      Type: t.type.toUpperCase(),
      Category: t.category,
      Amount: t.amount,
      Note: t.note,
      Person: t.personName || ''
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Aurelius_Finance_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToJSON = (customTransactions?: Transaction[]) => {
    const listToExport = customTransactions || transactions;
    const data = {
      app: "Aurelius Finance",
      metadata: {
        version: '1.2',
        timestamp: new Date().toISOString(),
        transactionCount: listToExport.length,
        currency: settings.currency,
        userName: user?.displayName || settings.name
      },
      transactions: listToExport,
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `aurelius_finance_backup_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (customTransactions?: Transaction[]) => {
    const listToExport = (customTransactions || transactions).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (listToExport.length === 0) return;

    const doc = new jsPDF();
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$';
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text("Aurelius Finance Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 30);
    doc.text(`User: ${settings.name}`, 14, 35);
    
    // Table
    const tableData = listToExport.map(t => [
      format(new Date(t.date), 'MMM dd, yyyy'),
      t.type.toUpperCase(),
      t.category,
      t.note || '-',
      t.personName || '-',
      `${SUPPORTED_CURRENCIES.find(c => c.code === t.currency)?.symbol || currency}${t.amount.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Date', 'Type', 'Category', 'Note', 'Person', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    const finalY = (doc as any).lastAutoTable.cursor.y;
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`Summary:`, 14, finalY + 15);
    doc.setFontSize(10);
    doc.text(`Income: ${currency}${summary.income.toLocaleString()}`, 14, finalY + 22);
    doc.text(`Expenses: ${currency}${summary.expenses.toLocaleString()}`, 14, finalY + 28);
    doc.text(`Net Impact: ${currency}${summary.savings.toLocaleString()}`, 14, finalY + 34);

    doc.save(`Aurelius_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const importFromExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const newTransactions: Transaction[] = json.map((row: any) => ({
          id: crypto.randomUUID(),
          date: row.Date || row.date || format(new Date(), 'yyyy-MM-dd'),
          type: (row.Type || row.type || 'expense').toLowerCase(),
          category: row.Category || row.category || 'Other',
          amount: parseFloat(row.Amount || row.amount || 0),
          note: row.Note || row.note || '',
          personName: row.Person || row.person || '',
          currency: settings.currency,
          createdAt: Date.now()
        })).filter(t => t.amount > 0);

        if (newTransactions.length === 0) {
          alert('No valid transactions found in file.');
          return;
        }

        const updatedTransactions = [...newTransactions, ...transactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTransactions(updatedTransactions);

        if (user && isFirebaseReady()) {
          const batch = writeBatch(db);
          newTransactions.forEach(t => {
            batch.set(doc(db, 'users', user.uid, 'transactions', t.id), cleanData({ ...t, userId: user.uid }));
          });
          await batch.commit();
        }

        alert(`Successfully imported ${newTransactions.length} transactions from Excel/CSV!`);
      } catch (err) {
        console.error('Excel Import error:', err);
        alert('Failed to parse file. Ensure headers are: Date, Type, Category, Amount, Note, Person');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importFromJSON = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          // Deduplication strategy: Use ID as unique key
          const existingIds = new Set(transactions.map(t => t.id));
          const newTransactions = data.transactions.filter((t: Transaction) => !existingIds.has(t.id));
          const duplicateCount = data.transactions.length - newTransactions.length;

          if (newTransactions.length === 0 && duplicateCount > 0) {
            alert('All transactions in this file already exist in your app.');
            return;
          }

          // Merge locally
          const updatedTransactions = [...newTransactions, ...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          setTransactions(updatedTransactions);
          if (data.settings) setSettings(data.settings);

          // If user is logged in, sync new transactions to Firestore
          if (user && isFirebaseReady() && newTransactions.length > 0) {
            const batch = writeBatch(db);
            newTransactions.forEach((t: Transaction) => {
              const transRef = doc(db, 'users', user.uid, 'transactions', t.id);
              batch.set(transRef, cleanData({ ...t, userId: user.uid }));
            });
            await batch.commit();
          }

          alert(`Import successful!\n\nAdded: ${newTransactions.length} new transactions.\nSkipped: ${duplicateCount} duplicates.`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return {
    transactions,
    settings,
    summary,
    categoryData,
    budgets,
    spendingThisMonthPerCategory,
    spendingPreviousMonthPerCategory,
    historicalBudgetPerformance,
    addTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    undoDelete,
    clearLastDeleted,
    lastDeleted,
    lentPerPerson,
    borrowedPerPerson,
    updateTransaction,
    updateMultipleTransactions,
    updateSettings,
    updateBudget,
    deleteBudget,
    exportToExcel,
    exportToPDF,
    exportToJSON,
    importFromJSON,
    importFromExcel,
    convertAmount,
    syncToGoogleDrive,
    isCloudSyncing,
    isDriveSyncing,
    lastDriveSync,
    lastCloudSync,
    isOnline,
    hasPendingWrites
  };
}
