using System;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace MiniCRM.WorkItem
{
    /// <summary>
    /// Plugin that automatically sets an order to "Completed" status when all related work items are completed
    /// </summary>
    public class SetOrderCompletedAutomatically : IPlugin
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
                if (context.MessageName.ToLower() == "update" 
                    && contextEntity.LogicalName.ToLower() == "new_workitem" 
                    && contextEntity.Contains("new_workitemstatus")
                    && context.PreEntityImages.Contains("PreImage"))
                {
                    // Get work item status, ID and related order
                    OptionSetValue new_workitemstatus = contextEntity.GetAttributeValue<OptionSetValue>("new_workitemstatus");
                    Guid new_workitemid = contextEntity.Id;

                    Entity preImage = context.PreEntityImages["PreImage"];
                    EntityReference new_order = preImage.GetAttributeValue<EntityReference>("new_order");

                    // Check all regarded work items if they are all completed (100000002)
                    if (new_workitemstatus.Value == 100000002 && new_order != null)
                    {
                        // Get all other work items for the same order
                        EntityCollection relatedWorkItems = GetOtherWorkItemsForOrder(new_order.Id, new_workitemid);

                        if (relatedWorkItems != null && relatedWorkItems.Entities.Count >= 0)
                        {
                            // Check if all other work items are completed
                            bool shouldUpdateOrder = IsEveryRegardedItemCompleted(relatedWorkItems);

                            if (shouldUpdateOrder)
                            {
                                Entity relatedOrder = service.Retrieve("new_order", new_order.Id, new ColumnSet("new_orderstatus"));
                                relatedOrder["new_orderstatus"] = new OptionSetValue(100000004); //Completed
                                service.Update(relatedOrder);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {

                throw new InvalidPluginExecutionException("Error setting order status to completed", ex);
            }
        }

        /// <summary>
        /// Checks if all work items in the collection are completed
        /// </summary>
        /// <param name="relatedWorkItems">Collection of work items to check</param>
        /// <returns>True if all work items are completed, false otherwise</returns>
        private bool IsEveryRegardedItemCompleted(EntityCollection relatedWorkItems)
        {
            bool allCompleted = true;
            // Iterate through all work items and check their status
            foreach (Entity workItem in relatedWorkItems.Entities)
            {
                OptionSetValue regardedWorkItemStatus = workItem.GetAttributeValue<OptionSetValue>("new_workitemstatus");

                if (regardedWorkItemStatus.Value != 100000002)
                {
                    allCompleted = false;
                    break; // First non-completed found, stop checking
                }
            }
            return allCompleted;
        }

        /// <summary>
        /// Retrieves all other work items for a specific order, excluding the current work item
        /// </summary>
        /// <param name="orderId">ID of the order</param>
        /// <param name="currentWorkItemId">ID of the current work item to exclude</param>
        /// <returns>Collection of other work items for the order</returns>
        private EntityCollection GetOtherWorkItemsForOrder(Guid orderId, Guid currentWorkItemId)
        {
            // Build query to get all work items for the order except the current one
            var query = new QueryExpression("new_workitem")
            {
                ColumnSet = new ColumnSet("new_workitemstatus"),
                Criteria = new FilterExpression
                {
                    Conditions =
            {
                new ConditionExpression("new_order", ConditionOperator.Equal, orderId),
                new ConditionExpression("new_workitemid", ConditionOperator.NotEqual, currentWorkItemId),
                new ConditionExpression("statecode", ConditionOperator.Equal, 0)
            }
                }
            };
            
            return service.RetrieveMultiple(query);
        }
    }
}

