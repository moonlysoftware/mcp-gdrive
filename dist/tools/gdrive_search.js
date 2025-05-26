import { google } from "googleapis";
export const schema = {
    name: "gdrive_search",
    description: "Search for files in Google Drive",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query for files and folders in Google Drive. trashed files are excluded by default. Use 'trashed = true' to include trashed files."
            },
            pageToken: {
                type: "string",
                description: "Token for the next page of results. Use if there are more results than can fit on one page. If not provided, the first page of results will be returned. Make sure the query is the same as the one used to get the token.",
                optional: true,
            },
            pageSize: {
                type: "number",
                description: "Number of results per page (max 100)",
                optional: true,
            },
        },
        required: ["query"],
    },
};
export async function search(args) {
    const drive = google.drive("v3");
    const userQuery = args.query?.trim();
    let searchQuery = "";
    if (!userQuery?.includes("trashed = true")) {
        searchQuery = `(${userQuery}) and trashed = false`;
    }
    else {
        searchQuery = userQuery;
    }
    const res = await drive.files.list({
        q: searchQuery,
        pageSize: args.pageSize || 10,
        pageToken: args.pageToken,
        corpora: "allDrives",
        spaces: "drive",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        orderBy: "modifiedTime desc",
        fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
    });
    const fileList = res.data.files
        ?.map((file) => `${file.id} ${file.name} (${file.mimeType})`)
        .join("\n");
    let response = `Found ${res.data.files?.length ?? 0} files:\n${fileList}`;
    response += `\n\nSearch query: '${searchQuery || "All files"}'`;
    // Add pagination info if there are more results
    if (res.data.nextPageToken) {
        response += `\n\nMore results available. Use pageToken: '${res.data.nextPageToken}' to fetch the next page.`;
    }
    return {
        content: [
            {
                type: "text",
                text: response,
            },
        ],
        isError: false,
    };
}
