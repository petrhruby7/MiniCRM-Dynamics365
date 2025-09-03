"use strict"
/**
 * OnLoad event handler for Order entity
 * @param {*} executionContext 
 */
var new_order_onLoad = function (executionContext){
    const formContext = executionContext.getFormContext();
    manageManagerApprovalVisibility(formContext);
}

/**
 * Onchange event handle for new_amount field
 * @param {*} executionContext 
 */
var new_amount_onChange = function (executionContext){
    const formContext = executionContext.getFormContext();
    manageManagerApprovalVisibility(formContext);
}

/**
 * Manages visibility of new_managerapproval according to new_amount field value
 * Shows field when Amount > 10,000 CZK, otherwise the field is hidden and cleared.
 * @param {*} formContext 
 */
var manageManagerApprovalVisibility = function (formContext){
    const new_amount = formContext.getAttribute("new_amount");
    const new_managerapproval = formContext.getAttribute("new_managerapproval")
    const managerApprovalControl = formContext.getControl("new_managerapproval")

    if (new_amount && new_managerapproval && managerApprovalControl){
        const amountValue = new_amount.getValue();

        if (amountValue != null && amountValue > 10000){
            managerApprovalControl.setVisible(true);
        } else {
            managerApprovalControl.setVisible(false);
            new_managerapproval.setValue(null);
        }
    }
}