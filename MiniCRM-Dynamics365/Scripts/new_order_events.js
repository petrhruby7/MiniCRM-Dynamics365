"use strict"
/**
 * OnLoad event handler for Order entity
 * @param {*} executionContext 
 */
var new_order_onLoad = async function (executionContext) {
    const formContext = executionContext.getFormContext();
    manageManagerApprovalVisibility(formContext);
    await manageOrderStatusOptions(formContext);
}

/**
 * Onchange event handle for new_amount field
 * @param {*} executionContext 
 */
var new_amount_onChange = async function (executionContext) {
    const formContext = executionContext.getFormContext();
    manageManagerApprovalVisibility(formContext);
    await manageOrderStatusOptions(formContext);

}

/**
 * Onchange event handle for new_managerapproval field
 * @param {*} executionContext 
 */
var new_managerapproval_onChange = async function (executionContext) {
    const formContext = executionContext.getFormContext();
    await manageOrderStatusOptions(formContext);
}

/**
 * Onchange event handle for new_orderstatus field
 * @param {*} executionContext 
 */
var new_orderstatus_onChange = function (executionContext){
    const formContext = executionContext.getFormContext();
    resetManageApprovalOnStatusChange(formContext)
}

/**
 * Manages visibility of new_managerapproval according to new_amount field value
 * Shows field when Amount > 10,000 CZK, otherwise the field is hidden and cleared.
 * @param {*} formContext 
 */
var manageManagerApprovalVisibility = function (formContext) {
    const new_amount = formContext.getAttribute("new_amount");
    const new_managerapproval = formContext.getAttribute("new_managerapproval")
    const managerApprovalControl = formContext.getControl("new_managerapproval")

    if (new_amount && new_managerapproval && managerApprovalControl) {
        const amountValue = new_amount.getValue();

        if (amountValue != null && amountValue > 10000) {
            managerApprovalControl.setVisible(true);
        } else {
            managerApprovalControl.setVisible(false);
            new_managerapproval.setValue(null);
        }
    }
}

/**
 * Manages the display of the options in the "new_orderstatus" OptionSet 
 * according to the status of the related work items
 * @param {*} formContext 
 */
var manageOrderStatusOptions = async function (formContext) {
    const new_orderstatus = formContext.getAttribute("new_orderstatus")
    const orderStatusControl = formContext.getControl("new_orderstatus");

    if (orderStatusControl && new_orderstatus) {
        //always remove choosen options - protection of duplicates
        orderStatusControl.removeOption(100000002) //Waiting for Approval
        orderStatusControl.removeOption(100000003) //Approved
        orderStatusControl.removeOption(100000004) //Completed

        const managerApprovalControl = formContext.getControl("new_managerapproval")
        // If new_managerapproval is visible, add "Waiting for Approval" option
        if (managerApprovalControl && managerApprovalControl.getVisible()) {
            orderStatusControl.addOption({ text: "Waiting for Approval", value: 100000002 }, 3)
        }

        const new_managerapproval = formContext.getAttribute("new_managerapproval")
        // If new_managerapproval is YES, add and set Approved option
        if (new_managerapproval && new_managerapproval.getValue() === true) {
            const orderStatusValue = new_orderstatus.getValue();
            // Don't show confirm dialog if Order Status id already Approved or Completed
            if (orderStatusValue !== 100000003 && orderStatusValue !== 100000004){
                const currentTextData = getLocalizedText('automaticallyApprove')
                const aprrove = await Xrm.Navigation.openConfirmDialog({
                    title: currentTextData.title,
                    text: currentTextData.text,
                    confirmButtonLabel: "OK",
                    cancelButtonLabel: currentTextData.cancelButtonLabel
                });
                if (aprrove.confirmed){
                    orderStatusControl.addOption({ text: "Approved", value: 100000003 }, 4)
                    new_orderstatus.setValue(100000003);
                } else {
                    new_managerapproval.setValue(false);
                }
            }
        }

        // If Plugin set new_orderstatus value to Completed - return this option
        if (new_orderstatus.getValue() === 100000004){
            orderStatusControl.addOption({ text: "Completed", value: 100000004 }, 5)
        }
    }
}

/**
 * Set Manager Approval to No, if status is not Approved (100000003) or Completed (100000004)
 * and Manager Approval is visible
 * @param {*} formContext 
 */
var resetManageApprovalOnStatusChange = function (formContext) {
    const new_orderstatus = formContext.getAttribute("new_orderstatus");
    const orderStatusControl = formContext.getControl("new_orderstatus");
    const new_managerapproval = formContext.getAttribute("new_managerapproval");
    const managerApprovalControl = formContext.getControl("new_managerapproval")

    if (new_orderstatus && new_managerapproval && managerApprovalControl){
        const orderStatusValue = new_orderstatus.getValue();
        const isManagerApprovalVisible = managerApprovalControl.getVisible();
        if (orderStatusValue !== 100000003 && orderStatusValue !== 100000004 && isManagerApprovalVisible){
            new_managerapproval.setValue(false);
            orderStatusControl.removeOption(100000003) //Approved
            orderStatusControl.removeOption(100000004) //Completed
        } 
    }
}

/**
 * Returns localized text based on user's language preference
 * Supports English (1033) and Czech (1029) with fallback to English
 * @param {string} textType - Type of text to retrieve
 * @returns {Object} - Localized text object
 */
var getLocalizedText = function (textType) {
    const _globalContext = Xrm.Utility.getGlobalContext();
    const userLcid = _globalContext.getUserLcid()

    const textData = {
        1033: {
            automaticallyApprove: {
                title: "Confirmation of approval",
                text: "Approving the order will automatically change the status to 'Approved'. Continue?",
                cancelButtonLabel: "Cancel"
            }
        },
        1029: {
            automaticallyApprove: {
                title: "Potvrzení schválení",
                text: "Schválením objednávky se automaticky změní stav na 'Approved'. Pokračovat?",
                cancelButtonLabel: "Zrušit"
            }
        }
    };

    // Fallback to English if user language is not supported
    return textData[userLcid][textType] || textData[1033][textType];
}