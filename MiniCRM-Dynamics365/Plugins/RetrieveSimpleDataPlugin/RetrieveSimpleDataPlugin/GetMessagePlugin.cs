using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace RetrieveSimpleDataPlugin
{
    public class GetMessagePlugin : IPlugin

    {
        private ITracingService tracer;
        private IPluginExecutionContext context;
        private IOrganizationServiceFactory serviceFactory;
        private IOrganizationService service;
        private Guid InitiatingUserID;
        public void Execute(IServiceProvider serviceProvider)
        {
            tracer = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            service = serviceFactory.CreateOrganizationService(context.UserId);

            InitiatingUserID = context.InitiatingUserId;

            try
            {
                tracer.Trace("=== Plugin GetSimpleData START ===");

                // Get input parameters from Custom API
                string fieldValue = context.InputParameters.Contains("FieldValue")
                    ? context.InputParameters["FieldValue"]?.ToString() 
                    : "No value provided";

                string entityId = context.InputParameters.Contains("EntityId") 
                    ? context.InputParameters["EntityId"]?.ToString()
                    : null;

                // Retrieve current user name 
                tracer.Trace($"Retrieving user: {context.UserId}");
                Entity user = service.Retrieve("systemuser", context.UserId, new ColumnSet("fullname"));
                string userName = user.GetAttributeValue<string>("fullname");
                tracer.Trace($"User name: {userName}");

                // Create message
                string message = $"Hello {userName}! Plugin executed at {DateTime.Now}";
                tracer.Trace(message);

                //Generate random number
                int randomNumber = new Random().Next(1, 100);
                tracer.Trace($"Random number: {randomNumber}");

                //Set output parameters
                context.OutputParameters["UserName"] = userName;
                context.OutputParameters["Message"] = message;
                context.OutputParameters["RandomNumber"] = randomNumber;
                context.OutputParameters["FieldValue"] = fieldValue;
                context.OutputParameters["Success"] = true;

            } catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Plugin: {ex.Message}", ex);
            }

        }
    }
}
