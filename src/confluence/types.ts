export interface ConfluencePageResponse {
    id: string;
    type: string;
    status: string;
    title: string;
    body?: {
        storage?: {
            value: string;
            representation: string;
        };
        view?: {
            value: string;
            representation: string;
        };
    };
    version?: {
        number: number;
        message?: string;
        when?: string;
        by?: {
            displayName: string;
            email?: string;
        };
    };
    space?: {
        key: string;
        name: string;
    };
    _links?: {
        base: string;
        context: string;
        webui: string;
        tinyui?: string;
        self: string;
    };
    metadata?: {
        labels?: {
            results: ConfluenceLabel[];
            start: number;
            limit: number;
            size: number;
        };
    };
    ancestors?: Array<{ id: string; title: string }>;
}

export interface ConfluenceSpaceResponse {
    id: number;
    key: string;
    name: string;
    type: string;
    _links: {
        base?: string;
        webui: string;
        self: string;
    };
}

export interface ConfluenceLabel {
    prefix: string;
    name: string;
    id: string;
    label?: string; // Some APIs return 'label' instead of 'name' or as full object
}

export interface ConfluenceSearchResponse {
    results: ConfluencePageResponse[];
    start: number;
    limit: number;
    size: number;
    totalSize: number;
}

export interface CreatePageParams {
    spaceKey: string;
    title: string;
    body: string; // Storage format (HTML)
    parentId?: string;
    labels?: string[];
}

export interface UpdatePageParams {
    id: string;
    title: string;
    body: string; // Storage format (HTML)
    version: number;
}

export enum PageStatus {
    CURRENT = 'current',
    TRASHED = 'trashed',
    DRAFT = 'draft',
}
