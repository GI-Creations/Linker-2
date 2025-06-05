import os
import json
from .apiManager import ApiManager


class DataLoader:
    """
    Handles all functions related to loading and processing data for the user.
    """

    def __init__(
        self,
        user_id: str,
        api_manager: ApiManager,
        config_filename="workflow-config.json",
    ):
        base_path = os.path.dirname(__file__)
        config_path = os.path.join(base_path, config_filename)
        with open(config_path, "r") as config_file:
            self.workflow_config = json.load(config_file)
        
        self.user_id = user_id
        self.api_manager = api_manager