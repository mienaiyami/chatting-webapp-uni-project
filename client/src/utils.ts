import TurndownService from "turndown";

const turndownService = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
});

export const convertHtmlToMarkdown = (html: string): string => {
    return turndownService.turndown(html);
};

export const getUserDetails = async () => {
    const response = await fetch("/api/userDetails", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${userToken}`,
        },
    });
    const json = await response.json();
    if (response.ok) return json.user;
    return null;
};

export const formatDate = (date: Date | string): string => {
    const now = new Date();
    const messageDate = new Date(date);

    const isToday =
        now.getDate() === messageDate.getDate() &&
        now.getMonth() === messageDate.getMonth() &&
        now.getFullYear() === messageDate.getFullYear();

    const timeString = messageDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    if (isToday) {
        return `Today at ${timeString}`;
    } else {
        const dateString = messageDate.toLocaleDateString("en-GB", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
        return `${dateString} at ${timeString}`;
    }
};

export const formatDate2 = (date: Date): string => {
    date = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    };

    return new Intl.DateTimeFormat("en-GB", options).format(date);
};
