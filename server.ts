import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Load Firebase Configuration
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let db: any;
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const firebaseApp = initializeApp(firebaseConfig);
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
    console.log('Firebase successfully initialized on server side.');
  } catch (error) {
    console.error('Failed to initialize Firebase on server:', error);
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', firebase: !!db });
  });

  // Mock initial definitions for pre-seeding
  const circles = [
    { id: 'C1', name: 'Thiruvananthapuram City', units: ['Thiruvananthapuram City', 'Thiruvananthapuram Central', 'Central Workshop', 'Pappanamcode', 'Vikas Bhavan', 'Peroorkada'] },
    { id: 'C2', name: 'Neyyattinkara', units: ['Neyyattinkara', 'Vellarada', 'Kattakada', 'Parassala'] },
    { id: 'C3', name: 'Vizhinjam', units: ['Vizhinjam', 'Poovar'] },
    { id: 'C4', name: 'Nedumangad', units: ['Nedumangad', 'Palode', 'Vithura', 'Vellanad', 'Aryanad'] },
    { id: 'C5', name: 'Munnar (Special Unit)', units: ['Munnar'] },
    { id: 'C6', name: 'Ernakulam', units: ['Ernakulam', 'Angamaly', 'North Paravur', 'Regional Workshop, Aluva'] },
    { id: 'C7', name: 'Kozhikode', units: ['Kozhikode', 'Thamarassery', 'Thottilpalam', 'Vadakara', 'Regional Workshop Kozhikode'] },
    { id: 'C8', name: 'Sulthan Bathery', units: ['Sulthan Bathery', 'Kalpetta', 'Mananthavady'] },
    { id: 'C9', name: 'Kasaragod', units: ['Kasaragod'] }
  ];

  const unitPositions: Record<string, number> = {
    'Thiruvananthapuram City': 0,
    'Thiruvananthapuram Central': 5,
    'Nedumangad': 20,
    'Kollam': 70,
    'Ernakulam': 220,
    'Munnar': 280,
    'Kozhikode': 380,
    'Kasaragod': 560
  };

  function getDistance(unitA: string, unitB: string) {
    if (unitA === unitB) return 0;
    const a = unitPositions[unitA] !== undefined ? unitPositions[unitA] : 0;
    const b = unitPositions[unitB] !== undefined ? unitPositions[unitB] : 0;
    return Math.abs(a - b);
  }

  const initialUnits = [
    { id: 'U1', name: 'Thiruvananthapuram City', circleName: 'Thiruvananthapuram City', zone: 'South', isSpecialUnit: false, sanctionedStrength: { 'Mechanic': 12, 'Assistant': 6, 'Typist': 2, 'Peon': 3, 'Station Master': 1 } },
    { id: 'U2', name: 'Thiruvananthapuram Central', circleName: 'Thiruvananthapuram City', zone: 'South', isSpecialUnit: false, sanctionedStrength: { 'Mechanic': 15, 'Assistant': 8, 'Typist': 3, 'Peon': 4, 'Station Master': 2 } },
    { id: 'U3', name: 'Kollam', circleName: 'Kollam', zone: 'South', isSpecialUnit: false, sanctionedStrength: { 'Mechanic': 8, 'Assistant': 4, 'Typist': 2, 'Peon': 2, 'Station Master': 1 } },
    { id: 'U4', name: 'Ernakulam', circleName: 'Ernakulam', zone: 'Central', isSpecialUnit: false, sanctionedStrength: { 'Mechanic': 20, 'Assistant': 10, 'Typist': 5, 'Peon': 5, 'Station Master': 2 } },
    { id: 'U5', name: 'Munnar', circleName: 'Munnar', zone: 'Central', isSpecialUnit: true, sanctionedStrength: { 'Mechanic': 5, 'Assistant': 2, 'Typist': 1, 'Peon': 1, 'Station Master': 1 } },
    { id: 'U6', name: 'Kozhikode', circleName: 'Kozhikode', zone: 'North', isSpecialUnit: false, sanctionedStrength: { 'Mechanic': 12, 'Assistant': 6, 'Typist': 3, 'Peon': 3, 'Station Master': 1 } },
    { id: 'U7', name: 'Kasaragod', circleName: 'Kasaragod', zone: 'North', isSpecialUnit: true, sanctionedStrength: { 'Mechanic': 6, 'Assistant': 3, 'Typist': 1, 'Peon': 1, 'Station Master': 1 } },
    { id: 'U8', name: 'Nedumangad', circleName: 'Nedumangad', zone: 'South', isSpecialUnit: false, sanctionedStrength: { 'Mechanic': 5, 'Assistant': 3, 'Typist': 1, 'Peon': 2, 'Station Master': 1 } },
  ];

  const initialEmployees = [
    { id: 'E1', penNumber: 'PEN1001', name: 'John Doe', dob: '1970-05-15', category: 'Mechanic', currentUnit: 'Thiruvananthapuram City', homeUnit: 'Thiruvananthapuram City', monthsInCurrentUnit: 60, workingAs: 'Inspector', leaveReason: '', leaveMonths: 0, lightDutyAs: '', dateOfEntryInService: '2019-01-15', dateOfEntry: '2021-05-20' },
    { id: 'E2', penNumber: 'PEN1002', name: 'Jane Smith', dob: '1966-07-20', category: 'Assistant', currentUnit: 'Ernakulam', homeUnit: 'Thiruvananthapuram City', monthsInCurrentUnit: 18, workingAs: '', leaveReason: '', leaveMonths: 0, lightDutyAs: '', dateOfEntryInService: '2023-11-20', dateOfEntry: '2024-11-20' },
    { id: 'E3', penNumber: 'PEN1003', name: 'Bob Johnson', dob: '1961-02-10', category: 'Station Master', currentUnit: 'Munnar', homeUnit: 'Nedumangad', monthsInCurrentUnit: 14, workingAs: '', leaveReason: 'Medical Leave', leaveMonths: 4, lightDutyAs: '', dateOfEntryInService: '2020-03-10', dateOfEntry: '2025-03-20' },
    { id: 'E4', penNumber: 'PEN1004', name: 'Alice Williams', dob: '1985-08-30', category: 'Typist', currentUnit: 'Kozhikode', homeUnit: 'Kozhikode', monthsInCurrentUnit: 3, workingAs: '', leaveReason: '', leaveMonths: 0, lightDutyAs: '', dateOfEntryInService: '2024-02-05', dateOfEntry: '2026-02-20' },
    { id: 'E5', penNumber: 'PEN1005', name: 'Charlie Brown', dob: '1990-12-05', category: 'Electrician', currentUnit: 'Ernakulam', homeUnit: 'Kasaragod', monthsInCurrentUnit: 6, workingAs: '', leaveReason: '', leaveMonths: 0, lightDutyAs: 'Helper', dateOfEntryInService: '2023-11-20', dateOfEntry: '2025-11-20' },
    { id: 'E6', penNumber: 'PEN1006', name: 'David Lee', dob: '1968-10-15', category: 'Peon', currentUnit: 'Kasaragod', homeUnit: 'Ernakulam', monthsInCurrentUnit: 10, workingAs: '', leaveReason: 'LWA', leaveMonths: 8, lightDutyAs: '', dateOfEntryInService: '2012-07-15', dateOfEntry: '2025-07-20' },
  ].map(emp => ({ 
    ...emp, 
    isDeleted: false, 
    leaveMonths: emp.leaveMonths || 0, 
    suspensionReason: '', 
    deputationTo: '', 
    trainingType: '', 
    workArrangementUnit: '', 
    workArrangementFromDate: '', 
    workArrangementToDate: '', 
    workArrangementReason: '', 
    workArrangementOrderNo: '', 
    distanceToHome: getDistance(emp.currentUnit, emp.homeUnit) 
  }));

  const initialCategories = [
    { id: 'C1', code: 'MECH', name: 'Mechanic', group: 'Mechanical Wing', designationLevel: 1, department: 'Mechanical', categoryType: 'Technical', transferType: 'State', seniorityType: 'Unit', sanctionedStrengthEnabled: true, isLowStrengthCategory: false, isSpecialCategory: false, displayOrder: 1, colorCode: '#ef4444', isActive: true },
    { id: 'C2', code: 'ELEC', name: 'Electrician', group: 'Mechanical Wing', designationLevel: 1, department: 'Mechanical', categoryType: 'Technical', transferType: 'State', seniorityType: 'Unit', sanctionedStrengthEnabled: true, isLowStrengthCategory: false, isSpecialCategory: false, displayOrder: 2, colorCode: '#f97316', isActive: true },
    { id: 'C3', code: 'ASST', name: 'Assistant', group: 'Ministerial Wing', designationLevel: 2, department: 'Ministerial', categoryType: 'Admin', transferType: 'State', seniorityType: 'State', sanctionedStrengthEnabled: true, isLowStrengthCategory: false, isSpecialCategory: false, displayOrder: 3, colorCode: '#10b981', isActive: true },
    { id: 'C4', code: 'TYP', name: 'Typist', group: 'Ministerial Wing', designationLevel: 3, department: 'Ministerial', categoryType: 'Admin', transferType: 'State', seniorityType: 'State', sanctionedStrengthEnabled: true, isLowStrengthCategory: false, isSpecialCategory: false, displayOrder: 4, colorCode: '#06b6d4', isActive: true },
    { id: 'C5', code: 'PEON', name: 'Peon', group: 'Ministerial Wing', designationLevel: 4, department: 'Ministerial', categoryType: 'Admin', transferType: 'District', seniorityType: 'District', sanctionedStrengthEnabled: true, isLowStrengthCategory: false, isSpecialCategory: false, displayOrder: 5, colorCode: '#6366f1', isActive: true },
    { id: 'C6', code: 'SM', name: 'Station Master', group: 'Operating Wing', designationLevel: 2, department: 'Operating', categoryType: 'Operations', transferType: 'State', seniorityType: 'State', sanctionedStrengthEnabled: true, isLowStrengthCategory: false, isSpecialCategory: true, displayOrder: 6, colorCode: '#8b5cf6', isActive: true },
  ];

  const initialCategoryGroups = [
    { id: 'CG1', name: 'Mechanical Wing', description: 'Technical staff for maintenance', color: '#ef4444', displayOrder: 1 },
    { id: 'CG2', name: 'Ministerial Wing', description: 'Administrative staff', color: '#10b981', displayOrder: 2 },
    { id: 'CG3', name: 'Operating Wing', description: 'Operations and management staff', color: '#8b5cf6', displayOrder: 3 }
  ];

  // Helper to fetch all records from a Firestore collection
  async function fetchCollection(collectionName: string): Promise<any[]> {
    if (!db) return [];
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      return [];
    }
  }

  // Helper to save/update a document in Firestore
  async function saveDoc(collectionName: string, docId: string, data: any): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.error(`Error saving document ${docId} in ${collectionName}:`, err);
    }
  }

  // Helper to delete a document in Firestore
  async function deleteDocRef(collectionName: string, docId: string): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error deleting document ${docId} from ${collectionName}:`, err);
    }
  }

  // Sync / Preseed database
  async function checkAndPreseed() {
    if (!db) return;
    try {
      const unitsSnap = await getDocs(collection(db, 'units'));
      if (unitsSnap.empty) {
        console.log('Pre-seeding units in Firestore...');
        for (const u of initialUnits) {
          await setDoc(doc(db, 'units', u.id), u);
        }
      }

      const categoriesSnap = await getDocs(collection(db, 'categories'));
      if (categoriesSnap.empty) {
        console.log('Pre-seeding categories in Firestore...');
        for (const cat of initialCategories) {
          await setDoc(doc(db, 'categories', cat.id), cat);
        }
      }

      const groupsSnap = await getDocs(collection(db, 'categoryGroups'));
      if (groupsSnap.empty) {
        console.log('Pre-seeding categoryGroups in Firestore...');
        for (const grp of initialCategoryGroups) {
          await setDoc(doc(db, 'categoryGroups', grp.id), grp);
        }
      }

      const empSnap = await getDocs(collection(db, 'employees'));
      if (empSnap.empty) {
        console.log('Pre-seeding employees in Firestore...');
        for (const emp of initialEmployees) {
          await setDoc(doc(db, 'employees', emp.id), emp);
        }
      }

      const histSnap = await getDocs(collection(db, 'history'));
      if (histSnap.empty) {
        console.log('Pre-seeding historyEvents in Firestore...');
        const initialEvent = {
          id: 'H_initial',
          createdAt: new Date().toISOString(),
          employeeId: 'E1',
          penNumber: 'PEN1001',
          eventType: 'Employee Created',
          newUnit: 'Thiruvananthapuram City',
          newCategory: 'Mechanic',
          remarks: 'Initial DB Seed'
        };
        await setDoc(doc(db, 'history', initialEvent.id), initialEvent);
      }

      const loginsSnap = await getDocs(collection(db, 'unit_logins'));
      if (loginsSnap.empty) {
        console.log('Pre-seeding default admin login in Firestore...');
        const defaultAdmin = {
          id: 'admin_default',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          allowedUnits: ['*'],
          canEdit: true,
          canTransfer: true
        };
        await setDoc(doc(db, 'unit_logins', defaultAdmin.id), defaultAdmin);
      }
    } catch (e) {
      console.error('Error checking and pre-seeding database:', e);
    }
  }

  // Pre-seed Firestore Database
  await checkAndPreseed();

  async function addHistory(event: any) {
    const id = `H${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEvent = {
      id,
      createdAt: new Date().toISOString(),
      ...event
    };
    await saveDoc('history', id, newEvent);
  }

  // HELPER TO CHECK USER PERMISSIONS SECURELY
  async function checkPermission(req: express.Request, action: 'edit' | 'transfer', unitToCheck?: string): Promise<{ allowed: boolean; user?: any; error?: string }> {
    const userId = req.headers['x-user-id'] as string;
    const username = req.headers['x-user-username'] as string;
    
    const logins = await fetchCollection('unit_logins');
    if (logins.length === 0) {
      return { allowed: true };
    }
    
    if (!userId) {
      return { allowed: false, error: "Authentication is required to perform this action. Please log in." };
    }
    
    const user = logins.find(u => u.id === userId && u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return { allowed: false, error: "Your session is invalid or expired. Please log in again." };
    }
    
    if (user.role === 'admin') {
      return { allowed: true, user };
    }
    
    if (action === 'edit') {
      if (!user.canEdit) {
        return { allowed: false, error: "Edit permission is currently locked for your account by the administrator." };
      }
      if (unitToCheck) {
        const hasAccess = user.allowedUnits.includes('*') || user.allowedUnits.includes(unitToCheck);
        if (!hasAccess) {
          return { allowed: false, error: `You do not have permission to modify records for unit "${unitToCheck}".` };
        }
      }
      return { allowed: true, user };
    }
    
    if (action === 'transfer') {
      if (!user.canTransfer) {
        return { allowed: false, error: "Transfer permission is currently locked for your account by the administrator." };
      }
      if (unitToCheck) {
        const hasAccess = user.allowedUnits.includes('*') || user.allowedUnits.includes(unitToCheck);
        if (!hasAccess) {
          return { allowed: false, error: `You do not have transfer permission for employees assigned to unit "${unitToCheck}".` };
        }
      }
      return { allowed: true, user };
    }
    
    return { allowed: false, error: "Action is unrecognized or unsupported." };
  }

  // HELPER TO GET CURRENT USER SECURELY
  async function getCurrentUser(req: express.Request): Promise<any | null> {
    const userId = req.headers['x-user-id'] as string;
    const username = req.headers['x-user-username'] as string;
    if (!userId) return null;
    try {
      const logins = await fetchCollection('unit_logins');
      return logins.find(u => u.id === userId && u.username.replace(/\s+/g, '').toLowerCase() === username.replace(/\s+/g, '').toLowerCase()) || null;
    } catch {
      return null;
    }
  }

  // AUTHENTICATION AND LOGIN MANAGEMENT ENDPOINTS
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const logins = await fetchCollection('unit_logins');
      
      if (logins.length === 0) {
        const defaultAdmin = {
          id: 'admin_default',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          allowedUnits: ['*'],
          canEdit: true,
          canTransfer: true
        };
        await saveDoc('unit_logins', defaultAdmin.id, defaultAdmin);
        logins.push(defaultAdmin);
      }
      
      // Compare after stripping all spaces and case-insensitively for ultimate resilience
      const cleanInput = username.replace(/\s+/g, '').toLowerCase();
      const user = logins.find(u => u.username.replace(/\s+/g, '').toLowerCase() === cleanInput && u.password === password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          allowedUnits: user.allowedUnits || [],
          canEdit: user.canEdit !== false,
          canTransfer: user.canTransfer !== false
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/logins', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can view logins." });
      }
      const list = await fetchCollection('unit_logins');
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/logins', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can manage logins." });
      }
      
      const { id, username, password, role, allowedUnits, canEdit, canTransfer } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const cleanUsername = username.replace(/\s+/g, '');
      if (!cleanUsername) {
        return res.status(400).json({ error: "Username cannot be empty or consist only of spaces" });
      }

      const list = await fetchCollection('unit_logins');
      const targetId = id || `U${Date.now()}`;
      
      const duplicate = list.some(u => u.id !== targetId && u.username.toLowerCase().trim() === cleanUsername.toLowerCase().trim());
      if (duplicate) {
        return res.status(400).json({ error: `A login with username "${cleanUsername}" already exists.` });
      }
      
      // Auto-correct casing and leading/trailing spaces against the actual units in DB to prevent permission lockouts
      const dbUnits = await fetchCollection('units');
      const normalizedAllowedUnits = (allowedUnits || []).map((name: string) => {
        const matched = dbUnits.find(du => du.name.toLowerCase().trim() === name.toLowerCase().trim());
        return matched ? matched.name : name;
      });
      
      const newLogin = {
        id: targetId,
        username: cleanUsername,
        password,
        role: role || 'unit',
        allowedUnits: role === 'admin' ? ['*'] : normalizedAllowedUnits,
        canEdit: canEdit !== false,
        canTransfer: canTransfer !== false
      };
      
      await saveDoc('unit_logins', targetId, newLogin);
      res.json({ success: true, login: newLogin });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/logins/bulk', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can import logins." });
      }
      
      const { bulkList } = req.body;
      if (!Array.isArray(bulkList)) {
        return res.status(400).json({ error: "Invalid dynamic format" });
      }
      
      const logins = await fetchCollection('unit_logins');
      const existingUsernames = new Set(logins.map(u => u.username.toLowerCase().trim()));
      let addedCount = 0;
      
      const dbUnits = await fetchCollection('units');
      
      for (const item of bulkList) {
        const rawUsername = item.username || "";
        const cleanUsername = rawUsername.replace(/\s+/g, '');
        if (!cleanUsername || !item.password) continue;
        
        if (existingUsernames.has(cleanUsername.toLowerCase().trim())) {
          continue;
        }
        
        existingUsernames.add(cleanUsername.toLowerCase().trim());
        const id = `U${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        let allowedUnits = item.allowedUnits || [];
        if (typeof allowedUnits === 'string') {
          allowedUnits = allowedUnits.split(/[;,/|]/).map((s: string) => s.trim()).filter(Boolean);
        }
        
        // Auto-correct casing and spaces for ultimate tolerance
        const normalizedAllowedUnits = allowedUnits.map((name: string) => {
          const matched = dbUnits.find(du => du.name.toLowerCase().trim() === name.toLowerCase().trim());
          return matched ? matched.name : name;
        });
        
        const newLogin = {
          id,
          username: cleanUsername,
          password: item.password,
          role: item.role || 'unit',
          allowedUnits: normalizedAllowedUnits,
          canEdit: item.canEdit !== false && item.canEdit !== 'false',
          canTransfer: item.canTransfer !== false && item.canTransfer !== 'false'
        };
        
        await saveDoc('unit_logins', id, newLogin);
        addedCount++;
      }
      
      res.json({ success: true, addedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/logins/:id', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can delete logins." });
      }
      
      const { id } = req.params;
      if (id === 'admin_default') {
        return res.status(400).json({ error: "The default system admin account cannot be deleted to prevent permanent lockout." });
      }
      
      await deleteDocRef('unit_logins', id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/logins/:id', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can update logins." });
      }
      
      const { id } = req.params;
      const { username, password, role, allowedUnits, canEdit, canTransfer } = req.body;
      
      const list = await fetchCollection('unit_logins');
      const existing = list.find(u => u.id === id);
      if (!existing) {
        return res.status(404).json({ error: "Login credential not found" });
      }

      let cleanUsername = existing.username;
      if (username) {
        cleanUsername = username.replace(/\s+/g, '');
        if (!cleanUsername) {
          return res.status(400).json({ error: "Username cannot be empty or consist only of spaces" });
        }
        const duplicate = list.some(u => u.id !== id && u.username.toLowerCase().trim() === cleanUsername.toLowerCase().trim());
        if (duplicate) {
          return res.status(400).json({ error: `A login with username "${cleanUsername}" already exists.` });
        }
      }

      let finalAllowedUnits = existing.allowedUnits;
      if (allowedUnits !== undefined) {
        const dbUnits = await fetchCollection('units');
        finalAllowedUnits = (allowedUnits || []).map((name: string) => {
          const matched = dbUnits.find(du => du.name.toLowerCase().trim() === name.toLowerCase().trim());
          return matched ? matched.name : name;
        });
      }

      const updatedLogin = {
        ...existing,
        username: cleanUsername,
        password: password !== undefined ? password : existing.password,
        role: role !== undefined ? role : existing.role,
        allowedUnits: role === 'admin' ? ['*'] : (allowedUnits !== undefined ? finalAllowedUnits : existing.allowedUnits),
        canEdit: canEdit !== undefined ? (canEdit === true || canEdit === 'true') : existing.canEdit,
        canTransfer: canTransfer !== undefined ? (canTransfer === true || canTransfer === 'true') : existing.canTransfer
      };

      await saveDoc('unit_logins', id, updatedLogin);
      res.json({ success: true, login: updatedLogin });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ENDPOINTS

  app.get('/api/history', async (req, res) => {
    let list = await fetchCollection('history');
    const user = await getCurrentUser(req);
    if (user && user.role !== 'admin' && !user.allowedUnits.includes('*')) {
      const lowerAllowed = user.allowedUnits.map((name: string) => name.toLowerCase().trim());
      list = list.filter(item => {
        const oldMatch = item.oldUnit && lowerAllowed.includes(item.oldUnit.toLowerCase().trim());
        const newMatch = item.newUnit && lowerAllowed.includes(item.newUnit.toLowerCase().trim());
        return oldMatch || newMatch;
      });
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.get('/api/circles', (req, res) => {
    res.json(circles);
  });

  app.get('/api/units', async (req, res) => {
    let list = await fetchCollection('units');
    if (req.query.all === 'true') {
      return res.json(list);
    }
    const user = await getCurrentUser(req);
    if (user && user.role !== 'admin' && !user.allowedUnits.includes('*')) {
      const lowerAllowed = user.allowedUnits.map((name: string) => name.toLowerCase().trim());
      list = list.filter(u => lowerAllowed.includes(u.name.toLowerCase().trim()));
    }
    res.json(list);
  });

  app.post('/api/units', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can manage units." });
      }
      
      const { name, district, type, associatedDepot } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Unit Name is required." });
      }
      
      const list = await fetchCollection('units');
      const duplicate = list.some(u => u.name.toLowerCase().trim() === name.toLowerCase().trim());
      if (duplicate) {
        return res.status(400).json({ error: `Unit "${name}" already exists.` });
      }
      
      const id = `U_${Date.now()}`;
      const newUnit = {
        id,
        name: name.trim(),
        district: district || 'Thiruvananthapuram',
        type: type || 'depot',
        associatedDepot: associatedDepot || '',
        sanctionedStrength: {},
        isSpecialUnit: false
      };
      
      await saveDoc('units', id, newUnit);
      res.json({ success: true, unit: newUnit });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/units/:id', async (req, res) => {
    try {
      const authCheck = await checkPermission(req, 'edit');
      if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Only administrators can manage units." });
      }
      
      const { id } = req.params;
      const { district, type, associatedDepot, sanctionedStrength } = req.body;
      
      const list = await fetchCollection('units');
      const existing = list.find(u => u.id === id);
      if (!existing) {
        return res.status(404).json({ error: "Unit not found" });
      }
      
      const updatedUnit = {
        ...existing,
        district: district !== undefined ? district : existing.district,
        type: type !== undefined ? type : existing.type,
        associatedDepot: associatedDepot !== undefined ? associatedDepot : (existing.associatedDepot || ''),
        sanctionedStrength: sanctionedStrength !== undefined ? sanctionedStrength : existing.sanctionedStrength
      };
      
      await saveDoc('units', id, updatedUnit);
      res.json({ success: true, unit: updatedUnit });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/categories', async (req, res) => {
    const categoriesList = await fetchCollection('categories');
    const groupsList = await fetchCollection('categoryGroups');
    res.json({ categories: categoriesList, groups: groupsList });
  });

  app.post('/api/categories', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const newCategory = { id: `C${Date.now()}`, ...req.body, isActive: true };
    await saveDoc('categories', newCategory.id, newCategory);
    res.json({ success: true, category: newCategory });
  });

  app.put('/api/categories/:id', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const { id } = req.params;
    const categoriesList = await fetchCollection('categories');
    const index = categoriesList.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Category not found" });
    
    const updatedCategory = { ...categoriesList[index], ...req.body };
    await saveDoc('categories', id, updatedCategory);

    if (req.body.name && req.body.name !== categoriesList[index].name) {
      const emps = await fetchCollection('employees');
      for (const emp of emps) {
        if (emp.category === categoriesList[index].name) {
          emp.category = req.body.name;
          await saveDoc('employees', emp.id, emp);
        }
      }
    }
    res.json({ success: true, category: updatedCategory });
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const { id } = req.params;
    const categoriesList = await fetchCollection('categories');
    const index = categoriesList.findIndex(c => c.id === id);
    if (index > -1) {
      const emps = await fetchCollection('employees');
      const inUse = emps.some(e => e.category === categoriesList[index].name);
      if (inUse) {
         categoriesList[index].isActive = false;
         await saveDoc('categories', id, categoriesList[index]);
      } else {
         await deleteDocRef('categories', id);
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post('/api/categories/merge', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const { sourceIds, targetId } = req.body;
    const categoriesList = await fetchCollection('categories');
    const target = categoriesList.find(c => c.id === targetId);
    if (!target) return res.status(404).json({ error: "Target category not found" });
    
    const emps = await fetchCollection('employees');
    for (const sId of sourceIds) {
       const source = categoriesList.find(c => c.id === sId);
       if (source) {
          for (const emp of emps) {
             if (emp.category === source.name) {
                emp.category = target.name;
                await saveDoc('employees', emp.id, emp);
             }
          }
          source.isActive = false;
          await saveDoc('categories', sId, source);
       }
    }
    res.json({ success: true });
  });

  app.post('/api/category-groups', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const newGroup = { id: `CG${Date.now()}`, ...req.body };
    await saveDoc('categoryGroups', newGroup.id, newGroup);
    res.json({ success: true, group: newGroup });
  });

  app.put('/api/category-groups/:id', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const { id } = req.params;
    const groups = await fetchCollection('categoryGroups');
    const index = groups.findIndex(g => g.id === id);
    if (index > -1) {
       const updatedGroup = { ...groups[index], ...req.body };
       await saveDoc('categoryGroups', id, updatedGroup);
       res.json({ success: true, group: updatedGroup });
    } else {
       res.status(404).json({ error: "Not found" });
    }
  });

  app.delete('/api/category-groups/:id', async (req, res) => {
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed || authCheck.user?.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Only administrators are allowed to manage categories." });
    }
    const { id } = req.params;
    const groups = await fetchCollection('categoryGroups');
    const index = groups.findIndex(g => g.id === id);
    if (index > -1) {
       const groupName = groups[index].name;
       const categoriesList = await fetchCollection('categories');
       for (const c of categoriesList) {
         if (c.group === groupName) {
           c.group = '';
           await saveDoc('categories', c.id, c);
         }
       }
       await deleteDocRef('categoryGroups', id);
       res.json({ success: true });
    } else {
       res.status(404).json({ error: "Not found" });
    }
  });

  app.post('/api/units/bulk-strength', async (req, res) => {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid data format" });
    }
    
    const authCheck = await checkPermission(req, 'edit');
    if (!authCheck.allowed) {
      return res.status(403).json({ error: authCheck.error });
    }
    
    // For unit users, check if they can edit each unit in the list
    if (authCheck.user?.role !== 'admin') {
      const logins = await fetchCollection('unit_logins');
      const userId = req.headers['x-user-id'] as string;
      const username = req.headers['x-user-username'] as string;
      const user = logins.find(u => u.id === userId && u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        if (!user.canEdit) {
          return res.status(403).json({ error: "Your edit options are currently locked by the administrator." });
        }
        for (const update of updates) {
          const { unitName } = update;
          const allowed = user.allowedUnits.includes('*') || user.allowedUnits.includes(unitName);
          if (!allowed) {
            return res.status(403).json({ error: `You do not have permission to edit the strength configuration for unit "${unitName}".` });
          }
        }
      }
    }

    const unitsList = await fetchCollection('units');
    let updatedCount = 0;
    for (const update of updates) {
      const { unitName, category, strength, badaliStrength } = update;
      const unit = unitsList.find(u => u.name === unitName);
      if (unit && category) {
        if (!unit.sanctionedStrength) {
          unit.sanctionedStrength = {};
        }
        if (!unit.sanctionedBadaliStrength) {
          unit.sanctionedBadaliStrength = {};
        }
        
        unit.sanctionedStrength[category] = Number(strength) || 0;
        if (badaliStrength !== undefined) {
           unit.sanctionedBadaliStrength[category] = Number(badaliStrength) || 0;
        }
        await saveDoc('units', unit.id, unit);
        updatedCount++;
      }
    }
    res.json({ success: true, updatedCount });
  });

  app.post('/api/employees', async (req, res) => {
    try {
      const { penNumber, name, dob, category, currentUnit, homeUnit, monthsInCurrentUnit, dateOfEntry, timeOfEntry, workingAs, leaveReason, leaveMonths, lightDutyAs, dateOfEntryInService, suspensionReason, deputationTo, trainingType, workArrangementUnit, workArrangementFromDate, workArrangementToDate, workArrangementReason, workArrangementOrderNo, isDeceased, isBadali } = req.body;
      
      const authHeaderCheck = await checkPermission(req, 'edit', currentUnit || '');
      if (!authHeaderCheck.allowed) {
        return res.status(403).json({ error: authHeaderCheck.error });
      }

      const formattedPen = (penNumber || '').replace(/\s+/g, '');
      if (!formattedPen) {
        return res.status(400).json({ error: "PEN number is required" });
      }

      const emps = await fetchCollection('employees');
      const duplicateExists = emps.some(e => !e.isDeleted && e.penNumber && e.penNumber.replace(/\s+/g, '').toLowerCase() === formattedPen.toLowerCase());
      if (duplicateExists) {
        return res.status(400).json({ error: `An employee with PEN number "${formattedPen}" already exists.` });
      }

      let computedMonths = Number(monthsInCurrentUnit) || 0;
      if (dateOfEntry) {
        const entry = new Date(dateOfEntry);
        const now = new Date();
        if (!isNaN(entry.getTime())) {
          computedMonths = (now.getFullYear() - entry.getFullYear()) * 12 + now.getMonth() - entry.getMonth();
          if (computedMonths < 0) computedMonths = 0;
        }
      }
      const newEmpId = `E${Date.now()}`;
      const newEmp = {
        id: newEmpId,
        penNumber: formattedPen,
        name: name || '',
        dob: dob || '',
        category: category || '',
        currentUnit: currentUnit || '',
        homeUnit: homeUnit || '',
        monthsInCurrentUnit: computedMonths,
        workingAs: workingAs || '',
        leaveReason: leaveReason || '',
        leaveMonths: Number(leaveMonths) || 0,
        lightDutyAs: lightDutyAs || '',
        dateOfEntryInService: dateOfEntryInService || dateOfEntry || '',
        dateOfEntry: dateOfEntry || '',
        isDeleted: false,
        isDeceased: isDeceased || false,
        isBadali: isBadali || false,
        suspensionReason: suspensionReason || '',
        deputationTo: deputationTo || '',
        trainingType: trainingType || '',
        workArrangementUnit: workArrangementUnit || '',
        workArrangementFromDate: workArrangementFromDate || '',
        workArrangementToDate: workArrangementToDate || '',
        workArrangementReason: workArrangementReason || '',
        workArrangementOrderNo: workArrangementOrderNo || '',
        distanceToHome: getDistance(currentUnit, homeUnit)
      };
      await saveDoc('employees', newEmpId, newEmp);
      await addHistory({ employeeId: newEmpId, penNumber: newEmp.penNumber, eventType: 'Employee Created', newUnit: newEmp.currentUnit, newCategory: newEmp.category });
      res.json({ success: true, employee: newEmp });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const emps = await fetchCollection('employees');
      const index = emps.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const oldEmp = emps[index];

      // Security check: must have edit permission for existing unit
      const originalUnit = oldEmp.currentUnit || '';
      const oldCheck = await checkPermission(req, 'edit', originalUnit);
      if (!oldCheck.allowed) {
        return res.status(403).json({ error: oldCheck.error });
      }

      const { penNumber, name, dob, category, currentUnit, homeUnit, monthsInCurrentUnit, dateOfEntry, workingAs, leaveReason, leaveMonths, lightDutyAs, dateOfEntryInService, suspensionReason, deputationTo, trainingType, workArrangementUnit, workArrangementFromDate, workArrangementToDate, workArrangementReason, workArrangementOrderNo, isDeceased, isBadali } = req.body;
      
      // If unit is being modified, must have transfer permissions as well, and only administrator can override directly
      if (currentUnit !== undefined && currentUnit !== originalUnit) {
        const transferCheck = await checkPermission(req, 'transfer', originalUnit);
        if (!transferCheck.allowed) {
          return res.status(403).json({ error: `Transfer Locked: ${transferCheck.error}` });
        }
        if (transferCheck.user && transferCheck.user.role !== 'admin') {
          return res.status(403).json({ error: "Direct depot changes are disabled for unit users. Please perform transfers via the dedicated 'Transfer' tool on the Process Transfers page (which triggers the pending verification workflow)." });
        }
      }
      
      let formattedPen = oldEmp.penNumber;
      if (penNumber !== undefined) {
        formattedPen = penNumber.replace(/\s+/g, '');
        if (!formattedPen) {
          return res.status(400).json({ error: "PEN number cannot be empty or just spaces" });
        }
        const duplicateExists = emps.some(e => !e.isDeleted && e.id !== id && e.penNumber && e.penNumber.replace(/\s+/g, '').toLowerCase() === formattedPen.toLowerCase());
        if (duplicateExists) {
          return res.status(400).json({ error: `An employee with PEN number "${formattedPen}" already exists.` });
        }
      }

      let computedMonths = Number(monthsInCurrentUnit) || 0;
      if (dateOfEntry) {
        const entry = new Date(dateOfEntry);
        const now = new Date();
        if (!isNaN(entry.getTime())) {
          computedMonths = (now.getFullYear() - entry.getFullYear()) * 12 + now.getMonth() - entry.getMonth();
          if (computedMonths < 0) computedMonths = 0;
        }
      }
      
      const updatedEmp = {
        ...emps[index],
        penNumber: formattedPen,
        name: name !== undefined ? name : emps[index].name,
        dob: dob !== undefined ? dob : emps[index].dob,
        category: category !== undefined ? category : emps[index].category,
        currentUnit: currentUnit !== undefined ? currentUnit : emps[index].currentUnit,
        homeUnit: homeUnit !== undefined ? homeUnit : emps[index].homeUnit,
        monthsInCurrentUnit: dateOfEntry ? computedMonths : (monthsInCurrentUnit !== undefined ? Number(monthsInCurrentUnit) : emps[index].monthsInCurrentUnit),
        workingAs: workingAs !== undefined ? workingAs : emps[index].workingAs,
        leaveReason: leaveReason !== undefined ? leaveReason : emps[index].leaveReason,
        leaveMonths: leaveMonths !== undefined ? Number(leaveMonths) : emps[index].leaveMonths,
        lightDutyAs: lightDutyAs !== undefined ? lightDutyAs : emps[index].lightDutyAs,
        dateOfEntryInService: dateOfEntryInService !== undefined ? dateOfEntryInService : emps[index].dateOfEntryInService,
        dateOfEntry: dateOfEntry !== undefined ? dateOfEntry : emps[index].dateOfEntry,
        suspensionReason: suspensionReason !== undefined ? suspensionReason : emps[index].suspensionReason,
        deputationTo: deputationTo !== undefined ? deputationTo : emps[index].deputationTo,
        trainingType: trainingType !== undefined ? trainingType : emps[index].trainingType,
        workArrangementUnit: workArrangementUnit !== undefined ? workArrangementUnit : emps[index].workArrangementUnit,
        workArrangementFromDate: workArrangementFromDate !== undefined ? workArrangementFromDate : emps[index].workArrangementFromDate,
        workArrangementToDate: workArrangementToDate !== undefined ? workArrangementToDate : emps[index].workArrangementToDate,
        workArrangementReason: workArrangementReason !== undefined ? workArrangementReason : emps[index].workArrangementReason,
        workArrangementOrderNo: workArrangementOrderNo !== undefined ? workArrangementOrderNo : emps[index].workArrangementOrderNo,
        isDeceased: isDeceased !== undefined ? isDeceased : emps[index].isDeceased,
        isBadali: isBadali !== undefined ? isBadali : emps[index].isBadali,
        distanceToHome: getDistance(currentUnit || emps[index].currentUnit, homeUnit || emps[index].homeUnit)
      };
      
      await saveDoc('employees', id, updatedEmp);
      
      let eventType = 'Edited Employee Details';
      if (oldEmp.currentUnit !== updatedEmp.currentUnit) {
         eventType = 'Administrative Transfer';
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType, oldUnit: oldEmp.currentUnit, newUnit: updatedEmp.currentUnit, remarks: 'Unit changed via Edit' });
      }
      if (!!oldEmp.isBadali !== !!updatedEmp.isBadali) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: updatedEmp.isBadali ? 'Badali Status Added' : 'Badali Status Removed', remarks: `Employee is now marked as ${updatedEmp.isBadali ? 'Badali' : 'Permanent'}` });
      }
      if (oldEmp.category !== updatedEmp.category) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Change of Category', oldCategory: oldEmp.category, newCategory: updatedEmp.category });
      }
      if (oldEmp.workingAs !== updatedEmp.workingAs && updatedEmp.workingAs) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Other Duty Assignment', remarks: `Assigned as ${updatedEmp.workingAs}` });
      }
      if (oldEmp.lightDutyAs !== updatedEmp.lightDutyAs && updatedEmp.lightDutyAs) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Light Duty Assignment', remarks: `Assigned as ${updatedEmp.lightDutyAs}` });
      }
      if (!oldEmp.leaveReason && updatedEmp.leaveReason) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Leave Started', remarks: `Reason: ${updatedEmp.leaveReason}` });
      }
      if (oldEmp.leaveReason && !updatedEmp.leaveReason) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Leave Ended', remarks: `Returned from ${oldEmp.leaveReason}` });
      }
      if (oldEmp.homeUnit !== updatedEmp.homeUnit) {
         await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Home Unit Change', oldUnit: oldEmp.homeUnit, newUnit: updatedEmp.homeUnit, remarks: 'Home Unit changed' });
      }

      await addHistory({ employeeId: updatedEmp.id, penNumber: updatedEmp.penNumber, eventType: 'Edited Employee Details', remarks: 'General Details Updated' });
      
      res.json({ success: true, employee: updatedEmp });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.post('/api/employees/bulk', async (req, res) => {
    try {
      const { employees: bulkList } = req.body;
      if (!Array.isArray(bulkList)) {
         return res.status(400).json({ error: "Invalid data format" });
      }
      
      const authSumCheck = await checkPermission(req, 'edit');
      if (!authSumCheck.allowed) {
        return res.status(403).json({ error: authSumCheck.error });
      }
      
      const emps = await fetchCollection('employees');
      
      const logins = await fetchCollection('unit_logins');
      const userId = req.headers['x-user-id'] as string;
      const username = req.headers['x-user-username'] as string;
      const user = logins.find(u => u.id === userId && u.username.toLowerCase() === username.toLowerCase());
      
      if (user && user.role !== 'admin') {
        for (const e of bulkList) {
          const targetUnit = e.currentUnit || '';
          const allowed = user.allowedUnits.includes('*') || user.allowedUnits.includes(targetUnit);
          if (!allowed) {
            return res.status(403).json({ error: `You do not have permission to bulk upload employees to unit "${targetUnit}".` });
          }
        }
      }

      const added = [];
      const existingPens = new Set(emps.filter(e => !e.isDeleted).map(e => e.penNumber?.replace(/\s+/g, '').toLowerCase()));
      for (const emp of bulkList) {
        const formattedPen = (emp.penNumber || '').replace(/\s+/g, '');
        if (!formattedPen) continue;
        if (existingPens.has(formattedPen.toLowerCase())) {
          console.log(`Skipping duplicate PEN in bulk upload: ${formattedPen}`);
          continue;
        }
        existingPens.add(formattedPen.toLowerCase());

        let computedMonths = Number(emp.monthsInCurrentUnit) || 0;
        if (emp.dateOfEntry) {
          const entry = new Date(emp.dateOfEntry);
          const now = new Date();
          if (!isNaN(entry.getTime())) {
            computedMonths = (now.getFullYear() - entry.getFullYear()) * 12 + now.getMonth() - entry.getMonth();
            if (computedMonths < 0) computedMonths = 0;
          }
        }
        const newEmpId = `E${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newEmp = {
          id: newEmpId,
          penNumber: formattedPen,
          name: emp.name || 'Unknown',
          category: emp.category || 'Assistant',
          currentUnit: emp.currentUnit || '',
          homeUnit: emp.homeUnit || '',
          monthsInCurrentUnit: computedMonths,
          workingAs: emp.workingAs || '',
          leaveReason: emp.leaveReason || '',
          leaveMonths: Number(emp.leaveMonths) || 0,
          lightDutyAs: emp.lightDutyAs || '',
          dateOfEntryInService: emp.dateOfEntryInService || emp.dateOfEntry || '',
          dateOfEntry: emp.dateOfEntry || '',
          isDeleted: false,
          isDeceased: emp.isDeceased || false,
          isBadali: emp.isBadali || (emp.category?.toLowerCase().includes('badali')),
          suspensionReason: '',
          deputationTo: '',
          trainingType: '',
          distanceToHome: getDistance(emp.currentUnit || '', emp.homeUnit || '')
        };
        await saveDoc('employees', newEmpId, newEmp);
        added.push(newEmp);
        await addHistory({ employeeId: newEmpId, penNumber: newEmp.penNumber, eventType: 'Employee Created', newUnit: newEmp.currentUnit, newCategory: newEmp.category, remarks: 'Bulk Upload' });
      }
      res.json({ success: true, added });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to upload bulk employees" });
    }
  });

  app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const emps = await fetchCollection('employees');
    const emp = emps.find(e => e.id === id);
    if (emp) {
      const authHeaderCheck = await checkPermission(req, 'edit', emp.currentUnit || '');
      if (!authHeaderCheck.allowed) {
        return res.status(403).json({ error: authHeaderCheck.error });
      }
      
      if (!emp.isDeleted) {
        emp.isDeleted = true;
        await saveDoc('employees', id, emp);
        await addHistory({ employeeId: emp.id, penNumber: emp.penNumber, eventType: 'Deletion (Soft Delete)', remarks: 'Employee marked as deleted' });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Employee already deleted" });
      }
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  });

  app.post('/api/employees/:id/restore', async (req, res) => {
    const { id } = req.params;
    const emps = await fetchCollection('employees');
    const emp = emps.find(e => e.id === id);
    if (emp) {
      const authHeaderCheck = await checkPermission(req, 'edit', emp.currentUnit || '');
      if (!authHeaderCheck.allowed) {
        return res.status(403).json({ error: authHeaderCheck.error });
      }
      
      if (emp.isDeleted) {
        emp.isDeleted = false;
        await saveDoc('employees', id, emp);
        await addHistory({ employeeId: emp.id, penNumber: emp.penNumber, eventType: 'Rejoining', remarks: 'Employee restored from deletion' });
        res.json({ success: true, employee: emp });
      } else {
        res.status(400).json({ error: "Employee is not deleted" });
      }
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  });

  app.get('/api/employees', async (req, res) => {
    const emps = await fetchCollection('employees');
    const unitsList = await fetchCollection('units');
    const user = await getCurrentUser(req);
    
    let filteredEmps = emps.filter(e => !e.isDeleted && !e.isDeceased);
    if (user && user.role !== 'admin' && !user.allowedUnits.includes('*')) {
      const lowerAllowed = user.allowedUnits.map((n: string) => n.toLowerCase().trim());
      filteredEmps = filteredEmps.filter(emp => {
        const currentMatch = emp.currentUnit && lowerAllowed.includes(emp.currentUnit.toLowerCase().trim());
        const targetMatch = emp.pendingTransfer?.targetUnit && lowerAllowed.includes(emp.pendingTransfer.targetUnit.toLowerCase().trim());
        const oldMatch = emp.pendingTransfer?.oldUnit && lowerAllowed.includes(emp.pendingTransfer.oldUnit.toLowerCase().trim());
        return currentMatch || targetMatch || oldMatch;
      });
    }

    const list = filteredEmps.map(emp => {
      let isEligible = false;
      let requiredIncumbencyMonths = 36;
      if (emp.currentUnit !== emp.homeUnit) {
        if (emp.distanceToHome > 300) {
           requiredIncumbencyMonths = 12;
        } else if (emp.distanceToHome >= 100) {
           requiredIncumbencyMonths = 24;
        }
        
        let unitDetails = unitsList.find(u => u.name === emp.currentUnit);
        if (unitDetails?.isSpecialUnit) {
           requiredIncumbencyMonths = 12;
        }

        if (emp.leaveMonths) {
          requiredIncumbencyMonths += Number(emp.leaveMonths);
        }

        if (emp.monthsInCurrentUnit >= requiredIncumbencyMonths) {
          isEligible = true;
        }
      }

      return {
        ...emp,
        requiredIncumbencyMonths,
        isEligible
      };
    });
    res.json(list);
  });

  app.get('/api/employees/deceased', async (req, res) => {
    const emps = await fetchCollection('employees');
    let list = emps.filter(e => !e.isDeleted && e.isDeceased);
    const user = await getCurrentUser(req);
    if (user && user.role !== 'admin' && !user.allowedUnits.includes('*')) {
      const lowerAllowed = user.allowedUnits.map((n: string) => n.toLowerCase().trim());
      list = list.filter(emp => emp.currentUnit && lowerAllowed.includes(emp.currentUnit.toLowerCase().trim()));
    }
    res.json(list);
  });

  app.post('/api/transfers/apply', async (req, res) => {
      const { employeeId, targetUnit, targetDate, reason, mode } = req.body;
      const emps = await fetchCollection('employees');
      const empIndex = emps.findIndex(e => e.id === employeeId);
      if(empIndex >= 0) {
          const oldUnit = emps[empIndex].currentUnit;
          
          const authCheck = await checkPermission(req, 'transfer', oldUnit || '');
          if (!authCheck.allowed) {
              return res.status(403).json({ error: authCheck.error });
          }

          const user = authCheck.user;
          // Determine transfer mode: non-admins are always unit-accepted (pending),
          // admins can specify 'unit-accepted' or default to 'direct'.
          const transferMode = (user && user.role === 'admin' && mode === 'direct') ? 'direct' : 'unit-accepted';

          if (transferMode === 'unit-accepted') {
              const today = new Date();
              emps[empIndex].pendingTransfer = {
                  targetUnit,
                  targetDate: targetDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                  reason: reason || 'Manual Transfer',
                  initiatedBy: user ? user.username : 'admin',
                  initiatedAt: today.toISOString(),
                  status: 'pending',
                  oldUnit
              };
              await saveDoc('employees', employeeId, emps[empIndex]);
              
              await addHistory({ 
                employeeId: emps[empIndex].id, 
                penNumber: emps[empIndex].penNumber, 
                eventType: 'Transfer Initiated', 
                oldUnit, 
                newUnit: targetUnit, 
                remarks: `Transfer initiated by ${user ? user.username : 'admin'} to ${targetUnit} (Pending Acceptance)`
              });

              return res.json({ success: true, isPending: true, employee: emps[empIndex] });
          } else {
              // Admin or unrestricted bypass - apply immediately
              emps[empIndex].currentUnit = targetUnit;
              emps[empIndex].monthsInCurrentUnit = 0;
              if (targetDate) {
                emps[empIndex].dateOfEntry = targetDate;
              } else {
                const today = new Date();
                emps[empIndex].dateOfEntry = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              }
              emps[empIndex].distanceToHome = getDistance(targetUnit, emps[empIndex].homeUnit); 
              emps[empIndex].pendingTransfer = null; // clear any pending transfer
              
              await saveDoc('employees', employeeId, emps[empIndex]);
              await addHistory({ 
                employeeId: emps[empIndex].id, 
                penNumber: emps[empIndex].penNumber, 
                eventType: 'Transfer', 
                oldUnit, 
                newUnit: targetUnit, 
                remarks: reason ? `Transfer Reason: ${reason} (Immediate Admin Override/Bypass)` : 'Immediate Transfer/Admin Override'
              });
              
              return res.json({ success: true, employee: emps[empIndex] });
          }
      } else {
          res.status(404).json({ error: "Employee not found" });
      }
  });

  // ACCEPT PENDING TRANSFER
  app.post('/api/transfers/:employeeId/accept', async (req, res) => {
      const { employeeId } = req.params;
      const emps = await fetchCollection('employees');
      const empIndex = emps.findIndex(e => e.id === employeeId);
      
      if (empIndex === -1) {
          return res.status(404).json({ error: "Employee not found." });
      }

      const emp = emps[empIndex];
      if (!emp.pendingTransfer) {
          return res.status(400).json({ error: "No pending transfer found for this employee." });
      }

      const targetUnit = emp.pendingTransfer.targetUnit;
      const oldUnit = emp.pendingTransfer.oldUnit || emp.currentUnit;

      // Authorization: The logged-in user must have permission over the TARGET/ACCEPTING unit or be an admin
      const authCheck = await checkPermission(req, 'transfer', targetUnit);
      if (!authCheck.allowed) {
          return res.status(403).json({ error: `Access Denied: Only users with transfer access for unit "${targetUnit}" or administrators can accept this transfer.` });
      }

      const user = authCheck.user;

      // Apply the transfer since it's accepted!
      emp.currentUnit = targetUnit;
      emp.monthsInCurrentUnit = 0;
      if (emp.pendingTransfer.targetDate) {
          emp.dateOfEntry = emp.pendingTransfer.targetDate;
      }
      emp.distanceToHome = getDistance(targetUnit, emp.homeUnit);
      const originalRemarks = emp.pendingTransfer.reason;
      
      // Clear the pending transfer
      emp.pendingTransfer = null;

      await saveDoc('employees', employeeId, emp);

      // Add History
      await addHistory({
          employeeId: emp.id,
          penNumber: emp.penNumber,
          eventType: 'Transfer Accepted',
          oldUnit,
          newUnit: targetUnit,
          remarks: `Transfer accepted by ${user?.username || 'user'}. Original reason: ${originalRemarks}`
      });

      res.json({ success: true, employee: emp });
  });

  // REJECT/CANCEL PENDING TRANSFER
  app.post('/api/transfers/:employeeId/reject', async (req, res) => {
      const { employeeId } = req.params;
      const { reason } = req.body;
      const emps = await fetchCollection('employees');
      const empIndex = emps.findIndex(e => e.id === employeeId);

      if (empIndex === -1) {
          return res.status(404).json({ error: "Employee not found." });
      }

      const emp = emps[empIndex];
      if (!emp.pendingTransfer) {
          return res.status(400).json({ error: "No pending transfer found for this employee." });
      }

      const targetUnit = emp.pendingTransfer.targetUnit;
      const oldUnit = emp.pendingTransfer.oldUnit || emp.currentUnit;

      // Authorization: either targetUnit user can reject, or old/source unit (revert/cancel), or admin
      const authCheck = await checkPermission(req, 'transfer');
      if (!authCheck.allowed) {
          return res.status(403).json({ error: authCheck.error });
      }

      const user = authCheck.user;
      const canReject = user.role === 'admin' || 
                        user.allowedUnits.includes('*') || 
                        user.allowedUnits.map((n: string) => n.toLowerCase().trim()).includes(targetUnit.toLowerCase().trim()) ||
                        user.allowedUnits.map((n: string) => n.toLowerCase().trim()).includes(oldUnit.toLowerCase().trim());

      if (!canReject) {
          return res.status(403).json({ error: `Access Denied: Only users from "${targetUnit}", sending depot "${oldUnit}", or an administrator can reject/cancel this transfer.` });
      }

      // Clear the pending transfer code
      emp.pendingTransfer = null;
      await saveDoc('employees', employeeId, emp);

      await addHistory({
          employeeId: emp.id,
          penNumber: emp.penNumber,
          eventType: 'Transfer Rejected',
          oldUnit,
          newUnit: targetUnit,
          remarks: `Transfer rejected/cancelled by ${user?.username || 'user'}${reason ? `. Reason: ${reason}` : ''}`
      });

      res.json({ success: true, employee: emp });
  });

  app.post('/api/transfers/bulk-apply', async (req, res) => {
     const { transfers, mode } = req.body;
     const transferMode = mode === 'direct' ? 'direct' : 'unit-accepted';

     if (!Array.isArray(transfers)) {
         return res.status(400).json({ error: "Invalid data format" });
     }
     
     const authCheck = await checkPermission(req, 'transfer');
     if (!authCheck.allowed) {
       return res.status(403).json({ error: authCheck.error });
     }
     
     const emps = await fetchCollection('employees');
     
     const logins = await fetchCollection('unit_logins');
     const userId = req.headers['x-user-id'] as string;
     const username = req.headers['x-user-username'] as string;
     const user = logins.find(u => u.id === userId && u.username.toLowerCase() === username.toLowerCase());
     
     if (user && user.role !== 'admin') {
       for (const t of transfers) {
         const emp = emps.find(e => e.penNumber === t.penNumber);
         if (emp) {
           const allowed = user.allowedUnits.includes('*') || user.allowedUnits.includes(emp.currentUnit || '');
           if (!allowed) {
             return res.status(403).json({ error: `You do not have transfer permission for employee "${emp.name}" because they are assigned to unit "${emp.currentUnit}".` });
           }
         }
       }
     }

     const updated = [];
     for (const transfer of transfers) {
         const empIndex = emps.findIndex(e => e.penNumber === transfer.penNumber);
         if (empIndex >= 0) {
             const oldUnit = emps[empIndex].currentUnit;
             const transferReason = transfer.reason || 'Bulk Transfer';

             if (transferMode === 'unit-accepted') {
                 // Pending target unit approval
                 const today = new Date();
                 emps[empIndex].pendingTransfer = {
                     targetUnit: transfer.targetUnit,
                     targetDate: transfer.targetDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                     reason: transferReason,
                     initiatedBy: username || 'admin',
                     initiatedAt: today.toISOString(),
                     status: 'pending',
                     oldUnit
                 };
                 await saveDoc('employees', emps[empIndex].id, emps[empIndex]);
                 updated.push(emps[empIndex]);

                 await addHistory({ 
                     employeeId: emps[empIndex].id, 
                     penNumber: emps[empIndex].penNumber, 
                     eventType: 'Transfer Initiated', 
                     oldUnit, 
                     newUnit: transfer.targetUnit, 
                     remarks: `Bulk Transfer initiated (Pending acceptance). Reason: ${transferReason}` 
                 });
             } else {
                 // Immediate Bypass / Direct
                 emps[empIndex].currentUnit = transfer.targetUnit;
                 emps[empIndex].monthsInCurrentUnit = 0;
                 if (transfer.targetDate) {
                   emps[empIndex].dateOfEntry = transfer.targetDate;
                 } else {
                   const today = new Date();
                   emps[empIndex].dateOfEntry = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                 }
                 emps[empIndex].distanceToHome = getDistance(transfer.targetUnit, emps[empIndex].homeUnit);
                 emps[empIndex].pendingTransfer = null; // Clear existing pending transfers
                 
                 await saveDoc('employees', emps[empIndex].id, emps[empIndex]);
                 updated.push(emps[empIndex]);
                 
                 await addHistory({ 
                     employeeId: emps[empIndex].id, 
                     penNumber: emps[empIndex].penNumber, 
                     eventType: 'Bulk Transfer', 
                     oldUnit, 
                     newUnit: transfer.targetUnit, 
                     remarks: `Bulk Transfer applied directly. Reason: ${transferReason}` 
                 });
             }
         }
     }
     res.json({ success: true, updated });
  });

  app.post('/api/employees/:id/work-arrangement', async (req, res) => {
    const { id } = req.params;
    const { targetUnit, fromDate, toDate, reason, orderNo } = req.body;
    const emps = await fetchCollection('employees');
    const emp = emps.find(e => e.id === id);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    
    emp.workArrangementUnit = targetUnit;
    emp.workArrangementFromDate = fromDate;
    emp.workArrangementToDate = toDate;
    emp.workArrangementReason = reason;
    emp.workArrangementOrderNo = orderNo;
    
    await saveDoc('employees', id, emp);
    await addHistory({ 
      employeeId: emp.id, 
      penNumber: emp.penNumber, 
      eventType: 'Work Arrangement Started', 
      oldUnit: emp.currentUnit, 
      newUnit: targetUnit, 
      remarks: `WA from ${fromDate} to ${toDate}. Reason: ${reason}` 
    });
    
    res.json({ success: true, employee: emp });
  });

  app.post('/api/employees/:id/end-work-arrangement', async (req, res) => {
    const { id } = req.params;
    const emps = await fetchCollection('employees');
    const emp = emps.find(e => e.id === id);
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    
    const waUnit = emp.workArrangementUnit;
    emp.workArrangementUnit = '';
    emp.workArrangementFromDate = '';
    emp.workArrangementToDate = '';
    emp.workArrangementReason = '';
    emp.workArrangementOrderNo = '';
    
    await saveDoc('employees', id, emp);
    await addHistory({ 
      employeeId: emp.id, 
      penNumber: emp.penNumber, 
      eventType: 'Work Arrangement Ended', 
      oldUnit: waUnit, 
      newUnit: emp.currentUnit, 
      remarks: `Returned to parent unit ${emp.currentUnit}` 
    });
    
    res.json({ success: true, employee: emp });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
