import axios from "axios";
import { NotificationManager } from "react-notifications";
import customStyles from '../components/customStyles';
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

export const changeStyle = (mapped) => {
    return {
        ...customStyles,
        control: (base, state) => ({
            ...base,
            // match with the menu
            // borderRadius: state.isFocused ? "3px 3px 0 0" : 3,
            // Overwrittes the different states of border
            borderColor: mapped ? 'green' : "red",
            // Removes weird border around container
            boxShadow: mapped ? null : null,
            "&:hover": {
                // Overwrittes the different states of border
                borderColor: mapped ? 'green' : "red"
            }
        }),
    }
}