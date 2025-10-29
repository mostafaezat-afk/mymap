// database.js - إدارة قاعدة البيانات IndexedDB

const DB_NAME = 'SupplyReportsDB';
const DB_VERSION = 1;
const STORE_NAME = 'reports';

// فتح قاعدة البيانات
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // إنشاء الفهارس
                objectStore.createIndex('date', 'date', { unique: false });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// حفظ البيانات
async function saveToDatabase(data) {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// الحصول على بيانات اليوم
async function getTodayData(db, date) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const index = objectStore.index('date');
        const request = index.getAll(date);
        
        request.onsuccess = () => {
            const records = request.result;
            const stats = {
                operations: records.length,
                supplyCards: 0,
                exchangeCards: 0,
                totalAmount: 0
            };
            
            records.forEach(record => {
                stats.supplyCards += record.supplyCards || 0;
                stats.exchangeCards += record.exchangeCards || 0;
                stats.totalAmount += (record.supplyTotal || 0) + (record.exchangeAmount || 0);
            });
            
            resolve(stats);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// الحصول على جميع البيانات
async function getAllData() {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// حذف سجل
async function deleteRecord(id) {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}