import { IPluginResponse } from "../interfaces/IPluginResponse";

export async function callGetSimpleData(
    baseUrl: string,
    fieldValue: string,
    entityId: string | null
): Promise<IPluginResponse> {

    const apiUrl = `${baseUrl}/api/data/v9.2/new_getsimpledata`;

    const requestBody = {
        FieldValue: fieldValue,
        EntityId: entityId
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Plugin error: ${response.status} - ${errorText}`);
    }

    const data: IPluginResponse = await response.json() as IPluginResponse;
    return data;
}
