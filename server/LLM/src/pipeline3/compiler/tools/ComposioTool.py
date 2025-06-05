import asyncio
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from composio_langchain import ComposioToolSet, Action, App
from composio import Composio
from ..base import StructuredTool
import json

class ComposioInput(BaseModel):
    action: str = Field(..., description="The Composio action to execute")
    parameters: Dict[str, Any] = Field(..., description="Parameters for the action")


class ComposioTool:
    def __init__(self, api_manager):
        self.composio_api_key = api_manager.get_key("COMPOSIO_API_KEY")
        self.composio_tool_set = ComposioToolSet(api_key=self.composio_api_key)
        self.client = Composio(api_key=self.composio_api_key)
        

    def _parse_parameters(self, parameters):
        if isinstance(parameters, str):
            try:
                return json.loads(parameters)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string for parameters")
        return parameters
    
    async def execute_action(self, action: str, parameters: Dict[str,Any], *args) -> str:
        """Execute a action on Composio asynchronously."""
        try:
            # Handle the case where parameters are split across multiple arguments
            if args:
                # Get all parts including the initial parameters
                all_parts = [str(parameters)] + [str(arg) for arg in args]
                
                # Extract the content between quotes, preserving the key-value structure
                parsed_parts = []
                for part in all_parts:
                    # Remove curly braces
                    part = part.strip('{}')
                    # Keep the quotes for the values
                    if ':' in part:
                        key, value = part.split(':', 1)
                        key = key.strip().strip("'\"")
                        value = value.strip()
                        parsed_parts.append(f'"{key}": {value}')
                
                # Combine into a proper JSON string
                combined_params = "{" + ", ".join(parsed_parts) + "}"
                
                try:
                    # Convert single quotes to double quotes for JSON compatibility
                    json_str = combined_params.replace("'", '"')
                    parsed_parameters = json.loads(json_str)
                except json.JSONDecodeError:
                    return f"Error: Could not parse parameters: {combined_params}"
            else:
                parsed_parameters = self._parse_parameters(parameters)
            enum_action = getattr(Action, action, None)
            if enum_action is None:
                return f"Error: Action '{action}' is not valid."
                
            result = await asyncio.to_thread(
                self.composio_tool_set.execute_action,
                action=enum_action,
                params=parsed_parameters
            )
            return result
        except (ValueError, Exception) as e:
            return f"An error occurred: {str(e)}"

    def get_tool(self):
        """Create and return a StructuredTool for this integration."""
        # apps = self.composio_tool_set.get_apps()
        # app_names = [app.name for app in apps]
        # actions = self.client.actions.get(limit=100)
        # print("ACTIONS:",actions)
        # action_names = [action.name for action in actions]
        # print("ACTION NAMES:",action_names)
        action_executor_tool = StructuredTool.from_function(
            func=self.execute_action,
            name="action_executor_tool", 
            description=(
                "action_executor_tool(action: str, parameters: dict) -> dict:\n"
                " - Executes actions via Composio integration.\n"
                " - Example usage:\n"
                "   action_executor_tool(ACTION, PARAMETERS)\n"
                " - For eg- action_executor_tool('GITHUB_GITHUB_UNSTAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER', {'owner': 'ComposioHQ', 'repo': 'composio'})\n"
                " - Parameters must be a single dictionary with single quotes only\n"
                " - Get action and parameters from action_finders"
                " - Use for Applications operations when needed, avoid otherwise."
            ),
            args_schema=ComposioInput,
        )
        return action_executor_tool