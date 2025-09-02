using System;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace MiniCRM.Order
{
    /// <summary>
    /// Plugin that automatically generates unique Order Code for new Order records
    /// Format: ORD-YYYY-MMDD-XXXX where XXXX is daily sequential number
    /// Executes on Create message, Pre-Operation stage
    /// </summary>
    public class OrderCodeAutoGenerationPlugin : IPlugin
    {
        private IPluginExecutionContext context;
        private IOrganizationServiceFactory serviceFactory;
        private IOrganizationService service;
        private Entity contextEntity;
        public void Execute(IServiceProvider serviceProvider)
        {
            context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            service = serviceFactory.CreateOrganizationService(context.UserId);
            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                contextEntity = (Entity)context.InputParameters["Target"];
            }

            try
            {
                if (context.MessageName.ToLower() == "create" && contextEntity.LogicalName.ToLower() == "new_order")
                {
                    //Check if order code already exist (prevent overwrite)
                    if (!contextEntity.Contains("new_ordercode") || contextEntity["new_ordercode"] == null)
                    {
                        //Get current date in organization timezone
                        DateTime utcNow = DateTime.UtcNow;
                        DateTime startOfDay = utcNow.Date; // Start of today in UTC
                        DateTime endOfDay = startOfDay.AddDays(1).AddSeconds(-1); // End of today in UTC

                        var query = new QueryExpression("new_order")
                        {
                            ColumnSet = new ColumnSet(false), // No column needed for count
                            Criteria = new FilterExpression
                            {
                                Conditions =
                            {
                                new ConditionExpression("createdon", ConditionOperator.OnOrAfter, startOfDay),
                                new ConditionExpression("createdon", ConditionOperator.OnOrBefore, endOfDay)
                            }
                            }
                        };

                        EntityCollection todaysOrders = service.RetrieveMultiple(query);
                        int todayOrderCount = todaysOrders.Entities.Count();
                        int sequence = todayOrderCount + 1;

                        string orderCode = $"ORD-{utcNow:yyyy-MMdd}-{sequence:D4}";
                        contextEntity["new_ordercode"] = orderCode;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException($"Failed to generate order code: {ex.Message}", ex);
            }
        }
    }
}
