// Generated from the Rust server's OpenAPI contract. Do not edit.
export interface paths {
    "/api/v1/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listFiles"];
        put?: never;
        post: operations["createFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getFile"];
        put: operations["updateFile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}/content": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["downloadFile"];
        put: operations["replaceContent"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}/duplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["duplicateFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["restoreFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}/trash": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["trashFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listVersions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/{id}/versions/{versionId}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["restoreVersion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/files/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["uploadFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["session"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/oauth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** BlobInfo */
        BlobInfo: {
            /** @description Content identifier of the blob, never the file identity or record revision. */
            cid: string;
            mimeType: string;
            /** Format: int64 */
            size: number;
        };
        /** CreateFile */
        CreateFile: {
            kind: components["schemas"]["FileKind"];
            name: string;
            parentId?: string;
        };
        /** DuplicateFile */
        DuplicateFile: {
            name: string;
            parentId?: string;
            revision: string;
        };
        /** ErrorBody */
        ErrorBody: {
            code: string;
            message: string;
        };
        /** FileEntry */
        FileEntry: {
            blob?: components["schemas"]["BlobInfo"];
            createdAt: string;
            /** @description Stable record key within the authenticated account's drive space. */
            id: string;
            kind: components["schemas"]["FileKind"];
            name: string;
            /** @description Omitted for a root-level entry. */
            parentId?: string;
            /** @description Current record CID, used to reject stale writes. */
            revision: string;
            /** Format: int64 */
            size: number;
            trashedAt?: string;
            updatedAt: string;
            uri: string;
        };
        /** @enum {string} */
        FileKind: "file" | "directory";
        /** FileList */
        FileList: {
            files: components["schemas"]["FileEntry"][];
        };
        /** FileVersion */
        FileVersion: {
            capturedAt: string;
            file: components["schemas"]["FileEntry"];
            fileId: string;
            /** @description Immutable version record key, distinct from the file's stable ID. */
            id: string;
        };
        /** LoginInput */
        LoginInput: {
            handle: string;
        };
        /** LoginOutput */
        LoginOutput: {
            redirectUrl: string;
        };
        /** RevisionInput */
        RevisionInput: {
            revision: string;
        };
        /** Session */
        Session: {
            space: components["schemas"]["Space"];
            user: components["schemas"]["User"];
        };
        /** Space */
        Space: {
            authorityDid: string;
            key: string;
            type: string;
            uri: string;
        };
        /**
         * UpdateFile
         * @description Renames a file without changing its parent or stable identity.
         */
        UpdateFile: {
            name: string;
            revision: string;
        };
        /** User */
        User: {
            did: string;
            handle: string;
        };
        /** VersionList */
        VersionList: {
            versions: components["schemas"]["FileVersion"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listFiles: {
        parameters: {
            query?: {
                parentId?: string;
                trash?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileList"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    createFile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["CreateFile"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    getFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    updateFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["UpdateFile"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    downloadFile: {
        parameters: {
            query?: never;
            header?: {
                Range?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "CONTENT-DISPOSITION": string;
                    ETAG: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": Blob;
                };
            };
            206: {
                headers: {
                    "CONTENT-DISPOSITION": string;
                    "CONTENT-RANGE": string;
                    ETAG: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": Blob;
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            416: {
                headers: {
                    "CONTENT-RANGE": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    replaceContent: {
        parameters: {
            query: {
                mimeType?: string;
                revision: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/octet-stream": Blob;
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    duplicateFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["DuplicateFile"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    restoreFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["RevisionInput"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    trashFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["RevisionInput"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    listVersions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["VersionList"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    restoreVersion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                versionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["RevisionInput"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    uploadFile: {
        parameters: {
            query: {
                mimeType?: string;
                name: string;
                parentId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/octet-stream": Blob;
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["FileEntry"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    "SET-COOKIE": string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    session: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["Session"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json; charset=utf-8": components["schemas"]["LoginInput"];
            };
        };
        responses: {
            200: {
                headers: {
                    "SET-COOKIE": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["LoginOutput"];
                };
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            502: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json; charset=utf-8": components["schemas"]["ErrorBody"];
                };
            };
        };
    };
}
