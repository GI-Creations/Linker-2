import json
import os
from langchain_cohere import ChatCohere
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import AzureChatOpenAI


class LLmHandler:
    def __init__(self, api_manager, config_filename="llm-config.json"):
        self.api_manager = api_manager
        base_path = os.path.dirname(__file__)
        config_path = os.path.join(base_path, config_filename)
        with open(config_path, "r") as config_file:
            self.llm_config = json.load(config_file)

        self.llm_class_mapping = {
            "ChatCohere": ChatCohere,
            "ChatGoogleGenerativeAI": ChatGoogleGenerativeAI,
            "ChatAnthropic": ChatAnthropic,
            "ChatGroq": ChatGroq,
            "AzureChatOpenAI": AzureChatOpenAI,
        }

    def get_llm(self, task_type):
        """
        Returns llm from llm-config.json file.
        """
        config = self.llm_config.get(task_type)
        if not config:
            raise ValueError(f"No LLM configuration found for task type: {task_type}")

        llm_class_name = config["llm"]
        llm_class = self.llm_class_mapping.get(llm_class_name)
        api_key = self.api_manager.get_key(config["api_key_name"])

        if llm_class_name == "AzureChatOpenAI":
            return llm_class(
                openai_api_version=config["openai_api_version"],
                openai_api_key=api_key,
                temperature=config["temperature"],
                azure_endpoint=config["openai_api_base"],
                openai_api_type=config["openai_api_type"],
                deployment_name=config["deployment_name"],
            )

        return llm_class(
            model=config["model"],
            temperature=config["temperature"],
            **{f"{config['api_key_name'].lower()}": api_key},
        )
