"use strict"
/**
 * OnLoad event handler for Order entity
 * @param {*} executionContext 
 */
var new_order_onLoad = async function (executionContext){
    const formContext = executionContext.getFormContext();
    manageManagerApprovalVisibility(formContext);
    await manageOrderStatusOptions (formContext);
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

/**
 * Manages the display of the "Completed" option in the "new_orderstatus" OptionSet 
 * according to the status of the related work items
 * @param {*} formContext 
 */
var manageOrderStatusOptions = async function (formContext){
    const orderStatusControl = formContext.getControl("new_orderstatus");
    const currentOrderId = formContext.data.entity.getId().replace(/{|}/g, '').toLowerCase();;

    if (orderStatusControl) {
        //always remove Completed option - protection of duplicates
        orderStatusControl.removeOption(100000004) //Complete
        // Order does not have Id on create form - retrieve isn't neccesary
        if (currentOrderId){
            //return current order work items which are not complete (100000002)
            const result = await Xrm.WebApi.retrieveMultipleRecords(
                "new_workitem",
                `?$filter=_new_order_value eq '${currentOrderId}' and new_workitemstatus ne 100000002`
            )
            
            // Add Completed option when no work item is founded
            if (!result || result.entities.length === 0) {
                orderStatusControl.addOption({text:"Completed", value: 100000004}, 5)
            }
        }
    }
}