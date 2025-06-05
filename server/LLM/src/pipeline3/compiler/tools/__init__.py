import os
import json
from .GithubComposioTool import GithubComposioTool
from .ComposioTool import ComposioTool
from .ComposioAppAndActionFinderTool import ComposioActionFinderTool
from .SearchTool import SearchTool
from .ComposioLinearActionFinderTool import ComposioLinearActionFinderTool
from .ComposioGithubActionFinderTool import ComposioGithubActionFinderTool

def get_all_tools(data_loader, api_manager, llm_handler, ticker_name, other_mentioned_ticker_names):
    """
    Loads tool configurations and returns a list of initialized tools based on the provided settings.
ticker_name
    This function reads a configuration file (`workflow-config.json`) to determine which tools 
    to initialize. It will conditionally add tools to the list based on the configuration, such 
    as the `SearchTool`, and always includes the `MacroDataRetrieverTool` and 
    `TickerDataRetrieverTool`. The tools are initialized with the appropriate dependencies 
    (like `data_loader` and `api_manager`), and ticker-specific information.

    Args:
        data_loader: An object responsible for loading data (used in `MacroDataRetrieverTool` 
                     and `TickerDataRetrieverTool`).
        api_manager: An object responsible for managing API interactions (used in `SearchTool`).
        llm_handler: An object responsible for creating llms based on requirement.
        ticker_name: The ticker name of the primary company for which data is being retrieved.
        other_mentioned_ticker_names: A list of additional tickers relevant to the context.

    Returns:
        list: A list of initialized tools, such as `SearchTool`, `MacroDataRetrieverTool`, 
              and `TickerDataRetrieverTool`, based on the configuration file.
    """
    base_path = os.path.dirname(__file__)
    config_path = os.path.abspath(os.path.join(base_path, "../../workflow-config.json"))
    with open(config_path, "r") as config_file:
        workflow_config = json.load(config_file)

    tools = []
    if workflow_config.get("useWebSearchTool")["value"]:
        tools.append(SearchTool(api_manager).get_tool())
    # if workflow_config.get("useGithubComposioTool")["value"]:
    #     tools.append(GithubComposioTool(api_manager).get_tool())

    # tools.append(ComposioLinearActionFinderTool(api_manager).get_tool())
    # tools.append(ComposioGithubActionFinderTool(api_manager).get_tool())
    tools.append(ComposioActionFinderTool(api_manager).get_tool())
    tools.append(ComposioTool(api_manager).get_tool())
    
    return tools
