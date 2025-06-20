import asyncio
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from composio_langchain import ComposioToolSet, Action, App
from composio import Composio
from ..base import StructuredTool

class ComposioLinearActionFinderInput(BaseModel):
    userQuery: str = Field(..., description="The userQuery to find the actions for")
    

class ComposioLinearActionFinderTool:
    def __init__(self, api_manager):
        self.composio_api_key = api_manager.get_key("COMPOSIO_API_KEY")
        self.composio_tool_set = ComposioToolSet(api_key=self.composio_api_key)
        self.client = Composio(api_key=self.composio_api_key)
        

    async def execute_action(self, userQuery: str, *args) -> str:
        """Execute a action on Composio asynchronously."""
        try:
            action_enums=self.composio_tool_set.find_actions_by_use_case(App.LINEAR, use_case=userQuery, advanced=False)
            # print("ACTIONS: ",str(action_enums[0]))
            # Get the action schema
            action_schema = self.composio_tool_set.get_action_schemas(actions=[action_enums[0]])
            print("ACTION SCHEMA RETURNED:",str(action_schema[0]))
            return str(action_schema[0])

        except ValueError as e:
            return f"Error: {str(e)}"
        except Exception as e:
            return f"An error occurred: {str(e)}"

    def get_tool(self):
        """Create and return a StructuredTool for this integration."""
        # apps = self.composio_tool_set.get_apps()
        # app_names = [app.name for app in apps]
        # actions = self.client.actions.get(limit=100)
        # print("ACTIONS:",actions)
        # action_names = [action.name for action in actions]
        # print("ACTION NAMES:",action_names)
        linear_action_finder_tool = StructuredTool.from_function(
            func=self.execute_action,
            name="linear_action_finder", 
            description=(
                "linear_action_finder(userQuery: str) -> dict:\n"
                " - Finds the most appropriate actions for userQuery.\n"
                " - Example usage:\n"
                "   linear_action_finder(USER_QUERY)\n"
                " - Returns a list of enums response with action results.\n"
                " - Always use before ComposioTool for getting the linear app action to execute and invoke ComposioTool after this always.\n"
                " - Use for Applications operations when needed, avoid otherwise."
            ),
            args_schema=ComposioLinearActionFinderInput,
        )
        return  linear_action_finder_tool