"use strict"

/**
* OnSave event handler for Client entity
* Validates registration number uniqueness before allowing save
* @param {*} executionContext 
*/
var new_client_OnSave = async function (executionContext) {
   const formContext = executionContext.getFormContext();
   await checkUniqueRegistrationNumber(formContext)
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