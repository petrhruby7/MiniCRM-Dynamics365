"use strict"

/**
 * OnLoad event handler for Client entity
 * @param {*} executionContext 
 */
var new_client_OnLoad = async function (executionContext) {
    const formContext = executionContext.getFormContext();
    await manageClientOrders(formContext);
}

/**
 * OnSave event handler for Client entity
 * Validates registration number uniqueness
 * @param {*} executionContext 
 */
var new_client_OnSave = async function (executionContext) {
    const formContext = executionContext.getFormContext();
    await checkUniqueRegistrationNumber(formContext)
}


/**
 * Manages the visibility, accessibility, and value of the fields in the client_value_assessment section
 * @param {*} formContext 
 */
var manageClientOrders = async function (formContext) {
    const new_clientimportancelevel = formContext.getAttribute("new_clientimportancelevel");
    const new_totalordersvalue = formContext.getAttribute("new_totalordersvalue");
    const valueAssessmentSection = formContext.ui.tabs.get("general_tab").sections.get("client_value_assessment")

    if (new_clientimportancelevel && new_totalordersvalue) {
        setFieldDisabled(formContext, "new_clientimportancelevel")
        setFieldDisabled(formContext, "new_totalordersvalue")

        const currentEntityId = formContext.data.entity.getId().replace(/{|}/g, '').toLowerCase();
        if (currentEntityId) {
            const orders = await retrieveClientsOrders(currentEntityId);

            if (orders && orders.entities.length > 0) {
                valueAssessmentSection.setVisible(true);

                let totalOrdersAmount = 0;
                orders.entities.forEach(order => {
                    const amountValue = order.new_amount
                    console.log("Amount value: " + amountValue)
                    totalOrdersAmount += amountValue || 0;
                });

                new_totalordersvalue.setValue(totalOrdersAmount);
                setClientImportanceLevel(new_clientimportancelevel, totalOrdersAmount);

            } else {
                new_clientimportancelevel.setValue(null);
                new_totalordersvalue.setValue(null);
                valueAssessmentSection.setVisible(false);
            }
        } else {
            valueAssessmentSection.setVisible(false);
        }
    }
}

/**
 * universal function for always locking fields
 * @param {*} formContext 
 * @param {string} targetField - the logical name of the field to lock
 */
var setFieldDisabled = function (formContext, targetField) {
    const fieldToDisabled = formContext.getControl(targetField);
    if (fieldToDisabled) {
        fieldToDisabled.setDisabled(true);
    }
}

/**
 * retrieves the amount from all active order entities linked to the current client  
 * @param {*} currentClientId - Id of current client 
 * @returns {Object|null} - WebApi result object with entities array
 */
var retrieveClientsOrders = async function (currentClientId) {
    let result = null;
    try {
        result = await Xrm.WebApi.retrieveMultipleRecords(
            "new_order",
            `?$select=new_amount&$filter=_new_client_value eq '${currentClientId}' and statecode eq 0`
        )
    } catch (error) {
        console.error("Failed to retrieve client orders:", error);
    }
    return result;
}

/**
 * Sets value of new_clientimportancelevel field according to the value of all active orders
 * @param {*} importanceLevelAttribute - Attribute object for client importance level field
 * @param {*} totalOrdersAmount - Total value of all active orders
 */
var setClientImportanceLevel = function (importanceLevelAttribute, totalOrdersAmount) {
    if (totalOrdersAmount <= 100000) {
        importanceLevelAttribute.setValue(100000000); //Standard Customer
    } else if (totalOrdersAmount > 100000 && totalOrdersAmount <= 500000) {
        importanceLevelAttribute.setValue(100000001); //Important Customer
    } else if (totalOrdersAmount > 500000) { 
        importanceLevelAttribute.setValue(100000002); // VIP Customer
    }
}

/**
 * Validates that registration number is unique across all active Client records
 * Displays notification if duplicate found, clears notification if unique
 * @param {*} formContext
 */
var checkUniqueRegistrationNumber = async function (formContext) {
    const new_registrationnumber = formContext.getAttribute("new_registrationnumber");
    const registrationNumberControl = formContext.getControl("new_registrationnumber")
    const formType = formContext.ui.getFormType();

    try {
        // Only validate if registration number field has a value
        if (new_registrationnumber && new_registrationnumber.getValue() !== null) {
            const regNumValue = new_registrationnumber.getValue();
            // Get current record ID for exclusion from duplicate check
            let filterquery = `new_registrationnumber eq '${regNumValue}' and statecode eq 0`

            // on crete form, current record does not have id
            if (formType !== 1) { //formType = 1 => create form
                const currentEntityId = formContext.data.entity.getId().replace(/{|}/g, '').toLowerCase();
                filterquery += ` and new_clientid ne '${currentEntityId}'`
            }

            // Query all active clients with same registration number, excluding current record
            const result = await Xrm.WebApi.retrieveMultipleRecords(
                "new_client",
                `?$select=new_registrationnumber&$filter=${filterquery}`
            )

            // Show error notification if duplicates found, otherwise clear any existing notification
            if (result && result.entities.length > 0) {
                const currentTextData = getLocalizedText('duplicateRegistrationNumber')
                registrationNumberControl.setNotification(currentTextData.message, "duplicateRegistrationNumber")
            } else {
                registrationNumberControl.clearNotification("duplicateRegistrationNumber");
            }
        }
    } catch (error) {
        console.error("Registration number validation failed:", error);
        registrationNumberControl.clearNotification("duplicateRegistrationNumber");
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
            duplicateRegistrationNumber: {
                message: `This registration number already exist for another client`
            }
        },
        1029: {
            duplicateRegistrationNumber: {
                message: `Toto registrační číslo (IČO) již existuje pro jiného klienta`
            }
        }
    };

    // Fallback to English if user language is not supported
    return textData[userLcid][textType] || textData[1033][textType];
}