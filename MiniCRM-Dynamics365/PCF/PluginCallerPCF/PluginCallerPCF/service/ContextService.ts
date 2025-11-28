import { IcontextMode, IContextWithPage } from "../interfaces/IContext";

export function getEntityId<T>(context: ComponentFramework.Context<T>): string | null {
    const mode = context.mode as unknown as IcontextMode;
    return mode.contextInfo?.enitityId ?? null;
}

export function getClientUrl<T>(context: ComponentFramework.Context<T>): string {
    const contextWithPage = context as unknown as IContextWithPage;
    return contextWithPage.page?.getClientUrl?.() ?? window.location.origin;
}