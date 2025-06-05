import time
import asyncio
from typing import List
from .DataLoader import DataLoader
from .LLmHandler import LLmHandler
from .apiManager import ApiManager
from .compiler.llm_compiler import LLMCompiler
from .compiler.llm_planner import LLMPlanner
from .compiler.constants import END_OF_PLAN
from .compiler.prompts import *
from .compiler.tools import get_all_tools


class QAGraph:
    def __init__(
        self,
        ticker_name: str,
        other_mentioned_ticker_names: List[str],
        user_id: str,
        api_manager,
        message_manager,
        memory=[],
        max_replan=3,
        verbose=False,
    ):
        self.user_id = user_id
        self.ticker_name = ticker_name
        self.other_mentioned_ticker_names = other_mentioned_ticker_names
        self.api_manager = api_manager
        self.message_manager = message_manager
        self.data_loader = DataLoader(user_id, api_manager)
        self.llm_handler = LLmHandler(api_manager)
        self.memory = memory
        self.max_replan = max_replan
        self.verbose = verbose
        self.planner_llm = self.llm_handler.get_llm("planner")
        self.llm = self.llm_handler.get_llm("joiner")
        self.tools = get_all_tools(self.data_loader, self.api_manager, self.llm_handler, self.ticker_name, self.other_mentioned_ticker_names)
        self.agent = LLMCompiler(
            name="LLMCompiler",
            tools=self.tools,
            planner_llm=self.planner_llm,
            planner_example_prompt=PLANNER_PROMPT,
            planner_example_prompt_replan=PLANNER_PROMPT,
            planner_stop=[END_OF_PLAN],
            planner_stream=False,
            agent_llm=self.llm,
            joinner_prompt=OUTPUT_PROMPT,
            joinner_prompt_final=OUTPUT_PROMPT,
            max_replans=3,
            benchmark=False,
            message_manager = self.message_manager,
            user_id = self.user_id,
            ticker_name = self.ticker_name,
            other_mentioned_ticker_names = self.other_mentioned_ticker_names
        )

        self.planner = LLMPlanner(
            name = "LLMPlanner",
            tools=self.tools,
            planner_llm=self.planner_llm,
            planner_example_prompt=PLANNER_PROMPT,
            example_prompt_replan=PLANNER_PROMPT,
            planner_stop=[END_OF_PLAN],
        )

    async def arun_and_time(self, func, *args, **kwargs):
        """helper function to run and time a function.
        Since function can error, we catch the error and return "ERROR" as the result
        """
        start = time.time()
        try:
            result = await func(*args, **kwargs)
        except Exception as e:
            print("Error", e)
            result = "ERROR"
        end = time.time()
        return result, end - start

    async def run(self, question):
        """
        runs the compiler asyncronously
        """
        raw_answer, _ = await self.arun_and_time(
            self.agent.arun,
            question,
            callbacks=None,
        )
        return raw_answer
    
    async def get_tasks(self, question):
        """
        Returns the planned tasks for the given question
        """
        tasks, _ = await self.arun_and_time(
            self.planner.arun,
            question,
            callbacks=None,
        )
        return tasks
    
if __name__ == "__main__":
    api_manager = ApiManager()
    question = "Analyse the LNT's revenue growth trends over the past 3-5 years."
    app = QAGraph(
            ticker_name="LNT",
            other_mentioned_ticker_names = [],
            user_id="pebbetibhanu2017@gmail.com",
            memory=[],
            api_manager=api_manager,
            verbose=True,
        )
    results = asyncio.get_event_loop().run_until_complete(app.run(question))
