import axios from 'axios';
import {API_BASE_URL} from '@/lib/utils';
export interface Activity{
    id: number;
    type: string;
    message: string;
    read: boolean;
    timestamp: string;
    patientID?: number;
}

export const getRecentActivity = async (): Promise<Activity[]> => {
    const token = localStorage.getItem('kenya-chw-token');
    if (!token) throw new Error("No auth token");

    const res = await axios.get(`${API_BASE_URL}/activities/recent`, { headers: {Authorization: `Bearer ${token}`},});
    return res.data;
};

export const markActivityAsRead = async (id: number): Promise<void> => {
    const token = localStorage.getItem('kenya-chw-token');
    if (!token) throw new Error("No auth token");

    await axios.patch(`${API_BASE_URL}/activities/${id}/read`, { headers: {Authorization: `Bearer ${token}`},});
};

export const logActivity = async (activity: {
    type: string;
    message: string;
    patientID?: number;
}): Promise<void> => {
    const token = localStorage.getItem('kenya-chw-token');
    if (!token) throw new Error("No auth token");

    await axios.post(`${API_BASE_URL}/activities`, activity, { headers: {Authorization: `Bearer ${token}`},});
};
