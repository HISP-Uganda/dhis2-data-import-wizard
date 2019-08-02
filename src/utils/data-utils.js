import axios from "axios";
import {NotificationManager} from "react-notifications";

export const callAxios = async (url, params, username, password) => {
    try {
        const levelResponse = await axios.get(url, {
            params,
            withCredentials: true,
            auth: {
                username,
                password
            }
        });

        return levelResponse.data;
    } catch (e) {
        NotificationManager.error(`Could not fetch data from ${url} ${e.message}`);
        return null;
    }
};

export const callAxios2 = async (url, params) => {
    try {
        const levelResponse = await axios.get(url, {
            params
        });

        return levelResponse.data;
    } catch (e) {
        NotificationManager.error(`Could not fetch data from ${url} ${e.message}`);
        return null;
    }
};

export const postAxios = async (url, query) => {
    try {
        const response = await axios.post(url, query);

        return response.data;
    } catch (e) {
        return null;
    }

};