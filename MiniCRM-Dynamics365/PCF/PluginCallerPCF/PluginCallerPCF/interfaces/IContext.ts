export interface IContextInfo {
    enitityId?: string;
}

export interface IcontextMode {
    contextInfo?: IContextInfo
}

export interface IPage {
    getClientUrl?: () => string;
}

export interface IContextWithPage {
    page?: IPage;
}