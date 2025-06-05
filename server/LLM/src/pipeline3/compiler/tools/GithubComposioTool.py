import asyncio
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from composio_langchain import ComposioToolSet, Action, App
from ..base import StructuredTool
import os

class GithubActionParameters(BaseModel):
    repository: Optional[str] = Field(None, description="Repository in format 'owner/repo'")
    owner: Optional[str] = Field(None, description="Repository owner")
    repo: Optional[str] = Field(None, description="Repository name")
    issue_number: Optional[int] = Field(None, description="Issue number")
    title: Optional[str] = Field(None, description="Title for issue or PR")
    body: Optional[str] = Field(None, description="Content body for issue or PR")
    branch: Optional[str] = Field(None, description="Branch name")

class GithubComposioInput(BaseModel):
    action: str = Field(..., description="The GitHub action to execute")
    parameters: GithubActionParameters = Field(..., description="Parameters for the action")

class GithubComposioTool:
    def __init__(self, api_manager):
        self.composio_api_key = api_manager.get_key("COMPOSIO_API_KEY")
        self.composio_tool_set = ComposioToolSet(api_key=self.composio_api_key)
        
        # Map of supported actions to their Composio Action enum
        self.action_map = {
            "star_repository": Action.GITHUB_STAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER,
            "unstar_repository": Action.GITHUB_UNSTAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER,
            "fork_repository": Action.GITHUB_CREATE_A_FORK,
            "create_issue": Action.GITHUB_CREATE_AN_ISSUE,
            "create_pull_request": Action.GITHUB_CREATE_A_PULL_REQUEST,
            "list_repository_issues": Action.GITHUB_LIST_REPOSITORY_ISSUES,
            "get_repository": Action.GITHUB_GET_A_REPOSITORY,
        }

    async def execute_action(self, action: str, parameters: GithubActionParameters) -> str:
        """Execute a GitHub action on Composio asynchronously."""
        try:
            # If parameters is a dict, parse it into a Pydantic model.
            if isinstance(parameters, dict):
                parameters = GithubActionParameters.parse_obj(parameters)
            if action not in self.action_map:
                raise ValueError(f"Unsupported action: {action}")

            # Extract repository owner and name if full repository string is provided
            if parameters.repository:
                owner, repo = parameters.repository.split('/')
                parameters.owner = owner
                parameters.repo = repo

            # Prepare parameters based on the action
            params = parameters.dict(exclude_none=True)
            if 'repository' in params:
                del params['repository']  # Remove the combined repository field

            # Execute the action
            result = await asyncio.to_thread(
                self.composio_tool_set.execute_action,
                action=self.action_map[action],
                params=params
            )
            return result

        except ValueError as e:
            return f"Error: {str(e)}"
        except Exception as e:
            return f"An error occurred: {str(e)}"

    def get_tool(self):
        """Create and return a StructuredTool for this integration."""
        github_composio_tool = StructuredTool.from_function(
            func=self.execute_action,
            name="github_composio_tool", 
            description=(
                "github_composio_tool(action: str, parameters: dict) -> dict:\n"
                " - Executes GitHub actions via Composio integration.\n"
                " - Example usage:\n"
                "   github_composio_tool(\"star_repository\", {\"repository\": \"ComposioHQ/composio\"})\n"
                "   github_composio_tool(\"unstar_repository\", {\"repository\": \"ComposioHQ/composio\"})\n"
                "   github_composio_tool(\"fork_repository\", {\"repository\": \"ComposioHQ/composio\"})\n"
                "   github_composio_tool(\"create_issue\", {\"repository\": \"ComposioHQ/composio\", \"title\": \"Bug\", \"body\": \"Description\"})\n"
                "   github_composio_tool(\"create_pull_request\", {\"repository\": \"ComposioHQ/composio\", \"title\": \"Feature\", \"body\": \"Changes\", \"branch\": \"dev\"})\n"
                "   github_composio_tool(\"list_repository_issues\", {\"repository\": \"ComposioHQ/composio\"})\n"
                "   github_composio_tool(\"get_repository\", {\"repository\": \"ComposioHQ/composio\"})\n"
                " - Returns JSON response with action results.\n"
                " - Use for GitHub operations when needed, avoid otherwise."
            ),
            args_schema=GithubComposioInput,
        )
        return github_composio_tool