// import axios from 'axios';
// import { API_BASE_URL } from '@/lib/utils';

// const USER_DATA_KEY = 'userData';
// const SYNC_QUEUE_KEY = 'syncQueue';

// interface UserData {
//     patients: any[];
//     consultations: any[];
//     activities: any[];
//     lastSync?: string;
// }

// interface SyncChange {
//     type: 'create' | 'update' | 'delete';
//     model: string;
//     data: any;
//     tempId?: string;
// }

// interface SyncResult {
//     type: string;
//     model: string;
//     tempId?: string;
//     id?: string;
//     error?: string;
// }

// // save initial data to local storage
// export const saveUserData = (patients: any[], consultations: any[], activities: any[]): void => {
//     localStorage.setItem(USER_DATA_KEY, JSON.stringify({
//         patients, consultations, activities, lastSync: new Date().toISOString()
//     }));
// };

// // Queue ofline changes
// export const addToSyncQueue = (change: SyncChange): void => {
//     const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
//     queue.push(change);
//     localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
// };

// // Helper to get token
// const getToken = (): string | null => { 
//     const token = localStorage.getItem('token');
//     if (!token) throw new Error('No authentication token found');
//     return token
// };

// // Process sync queue
// export const syncOfflineChanges = async (): Promise<{success: boolean, error?: string}> => {
//     const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
//     if (queue.length === 0) return {success: true};

//     try{
//         const token = getToken();
//         const response = await axios.post(`${API_BASE_URL}/api/sync`, {changes: queue}, {headers: {Authorization: `Bearer ${token}`}});

//         // Update local data with server IDs
//         const userData: UserData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
//         response.data.results.forEach((result: SyncResult) => {
//             if (result.type === 'create' && result.tempId && result.id) {
//                 replaceTempIds(userData, result.model, result.tempId, result.id);
//             }
//         });

//         localStorage.removeItem(SYNC_QUEUE_KEY);
//         localStorage.setItem(USER_DATA_KEY, JSON.stringify({...userData, lastSync: new Date().toISOString()}));
//         return {success: true};
//     } catch (error) {
//         console.error('Sync failed', error);
//         return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
//     }
// };

// // replace temporary IDs
// const replaceTempIds = (userData: UserData, model: string, tempId: string, realId: string): void => {
//     const modelKey = `${model.toLowerCase()}s` as keyof UserData;
//     let data = userData[modelKey];

//     if (Array.isArray(data)) {
//         userData[modelKey] = data.map(item => {
//             if (item.id === tempId || item.tempId === tempId) { return { ...item, id: realId, tempId }; }
//             return item;
//         });
//     } else { console.warn(`ReplaceTempIds: ${modelKey} is not an array: `, data); }
// };
