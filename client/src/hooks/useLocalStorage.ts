import React, { useState, useEffect } from "react";

const useLocalStorage = (
    key: string,
    defaultValue: string
): [string, React.Dispatch<React.SetStateAction<string>>] => {
    const [value, setValue] = useState<string>(() => {
        let currVal;
        try {
            currVal = JSON.parse(
                localStorage.getItem(key) || String(defaultValue)
            );
        } catch (error) {
            currVal = defaultValue;
            console.error(error);
        }
        return currVal;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    }, [value, key]);

    return [value, setValue];
};

export default useLocalStorage;

export const setLocalStorage = <T1 extends string, T2>(key: T1, value: T2) => {
    try {
        localStorage.setItem(String(key), JSON.stringify(value));
    } catch (error) {
        console.error(error);
    }
};
