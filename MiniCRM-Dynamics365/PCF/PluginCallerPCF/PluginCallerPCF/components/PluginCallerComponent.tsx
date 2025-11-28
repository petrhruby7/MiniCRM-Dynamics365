import * as React from "react";
import { IPluginCallerProps } from "../interfaces/IPluginCallerProps";
import { IPluginResponse } from "../interfaces/IPluginResponse";
import { Button, MessageBar, MessageBarBody, MessageBarTitle, } from "@fluentui/react-components";
import { callGetSimpleData } from "../service/PluginService";
import { getClientUrl, getEntityId } from "../service/ContextService";

export const PluginCallerComponent: React.FC<IPluginCallerProps> = ({context}) => {
    const [isLoading, setIsLoading] = React.useState(false); 
    const [result, setResult] = React.useState<IPluginResponse | null>(null)
    const [error, setError] = React.useState<string | null>(null);

    const fieldValue = context.parameters.boundField.raw ?? "";  

    const callPlugin = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setResult(null);

            const fieldVal = context.parameters.boundField.raw ?? "";
            const entityId = getEntityId(context);
            const clientUrl = getClientUrl(context)

            const data = await callGetSimpleData(clientUrl, fieldVal, entityId)
            
            setResult(data);
        } catch (err) {
            const errorMessaged = err instanceof Error ? err.message : "Unknown error occured";
            setError(errorMessaged)
        } finally {
            setIsLoading(false)
        }
    };

    const stackTokensElement = (
        <>
            {/* Current field value */}
            <MessageBar intent="info">
                <MessageBarBody>
                    <MessageBarTitle>Current field value</MessageBarTitle>
                    {fieldValue}
                </MessageBarBody>
            </MessageBar>

            {/* Button */}
            <Button
                appearance="primary"
                onClick={() => { void callPlugin(); }}
                disabled={isLoading}
            >
                {isLoading ? "Calling...": "Call Plugin"}
            </Button>

            {/* Error */}
            {error && (
                <MessageBar intent="error" >
                    <MessageBarBody>
                        <MessageBarTitle>Error</MessageBarTitle>
                        {error}
                    </MessageBarBody>
                </MessageBar>
            )}

            {/* Result */}
            {result && (
                <MessageBar intent="success">
                    <MessageBarBody>
                        <MessageBarTitle>Plugin Result</MessageBarTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <div><strong>User Name:</strong> {result.UserName}</div>
                            <div><strong>Message:</strong> {result.Message}</div>
                            <div><strong>Random Number:</strong> {result.RandomNumber}</div>
                            <div><strong>Field Value:</strong> {result.FieldValue}</div>
                            <div><strong>Success:</strong> {result.Success ? '✓' : '✗'}</div>
                        </div>
                    </MessageBarBody>
                </MessageBar>
            )}
        </>

    );

    return (
        <div style={{
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px' 
        }}>
            {stackTokensElement}
        </div>
    );
}
