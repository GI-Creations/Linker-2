from typing import Any, Dict, List, Optional, Sequence, Union
from langchain.callbacks.manager import AsyncCallbackManagerForChainRun
from langchain.llms.base import BaseLLM
from .chain import Chain
from .base import StructuredTool, Tool
from .planner import Planner
from .logger_utils import log
from pydantic import Field

class LLMPlanner(Chain):
    """LLM Planner Engine that returns tasks."""
    planner: Planner = Field(default=None)
    input_key: str = "input"
    output_key: str = "output"

    def __init__(
        self,
        tools: Sequence[Union[Tool, StructuredTool]],
        planner_llm: BaseLLM,
        planner_example_prompt: str,
        planner_stop: Optional[list[str]],
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
            
        self.planner = Planner(
            llm=planner_llm,
            example_prompt=planner_example_prompt,
            example_prompt_replan=planner_example_prompt,
            tools=tools,
            stop=planner_stop,
        )

    @property
    def input_keys(self) -> List[str]:
        return [self.input_key]

    @property
    def output_keys(self) -> List[str]:
        return [self.output_key]

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ):
        raise NotImplementedError("LLMPlanner is async only.")

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        tasks = await self.planner.plan(
            inputs=inputs,
            is_replan=False,
        )
        log("Graph of tasks: ", tasks, block=True) 
        return {self.output_key: tasks}

    def get(self, key):
        return getattr(self, key, None)