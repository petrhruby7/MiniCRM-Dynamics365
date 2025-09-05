using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace MiniCRM.WorkItem
{
    public class SetOrderCompletedAutomatically : IPlugin
    {
        private ITracingService tracer;
        private IPluginExecutionContext context;
        private IOrganizationServiceFactory serviceFactory;
        private IOrganizationService service;
        private Entity contextEntity;
        private Entity FullEntity;
        private Guid InitiatingUserID;
        public void Execute(IServiceProvider serviceProvider)
        {
            tracer = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            service = serviceFactory.CreateOrganizationService(context.UserId);
            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                contextEntity = (Entity)context.InputParameters["Target"];
                InitiatingUserID = context.InitiatingUserId;
            }

            try
            {
                if (context.MessageName.ToLower() == "update" && contextEntity.LogicalName.ToLower() == "new_workitem" && contextEntity.Contains("new_workitemstatus"))
                {
                    tracer.Trace("NEED REFACTORING AND TESTING");


                    OptionSetValue new_workitemstatus = contextEntity.GetAttributeValue<OptionSetValue>("new_workitemstatus");
                    Guid new_workitemid = contextEntity.GetAttributeValue<Guid>("new_workitemid");

                    // Check all regarded work items if they are all completed (100000002)
                    if (new_workitemstatus.Value == 100000002)
                    {
                        //Get regarded order
                        EntityReference new_order = contextEntity.GetAttributeValue<EntityReference>("new_order");

                        var query = new QueryExpression("new_workitem")
                        {
                            ColumnSet = new ColumnSet("new_workitemstatus"),
                            Criteria = new FilterExpression
                            {
                                Conditions =
                                {
                                    new ConditionExpression("new_order", ConditionOperator.Equal, new_order),
                                    new ConditionExpression("new_workitemid", ConditionOperator.NotEqual, new_workitemid)
                                }
                            }
                        };
                        
                        EntityCollection regardedWorkItems = service.RetrieveMultiple(query);


                        if (regardedWorkItems != null && regardedWorkItems.Entities.Count >= 0)
                        {
                            int sumOfCompletedWorkItems = 0;
                            foreach (Entity workItem in regardedWorkItems.Entities)
                            {
                                OptionSetValue regardedWorkItemStatus = workItem.GetAttributeValue<OptionSetValue>("new_workitemstatus");
                                if (regardedWorkItemStatus.Value == 100000002)
                                {
                                    sumOfCompletedWorkItems++;
                                }
                            }

                            if (sumOfCompletedWorkItems == regardedWorkItems.Entities.Count)
                            {
                                Entity regardedOrder = service.Retrieve("new_order", new_order.Id, new ColumnSet("new_orderstatus"));
                                regardedOrder["new_orderstatus"] = 100000004; //Completed
                            }
                        } 
                    }
                }


            } catch (Exception ex)
            {
                throw new InvalidPluginExecutionException("Can't set order status to completed", ex);
            }
        }
    }
}
