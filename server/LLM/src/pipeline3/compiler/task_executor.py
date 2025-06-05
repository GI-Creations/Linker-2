import asyncio
from typing import Dict, Optional, Mapping
from langchain.llms.base import BaseLLM

from .task_fetching_unit import Task, TaskFetchingUnit
from .data_processing import DataProcessor
from .logger_utils import log, log_task_execution
from .prompts import NO_ANWER_REPLY
from .llm_compiler import LLMCompilerAgent

class TaskExecutor:
    def __init__(
        self,
        agent_llm: BaseLLM,
        joinner_prompt: str,
        joinner_prompt_final: Optional[str],
        message_manager,
        user_id: str,
        ticker_name: str,
        other_mentioned_ticker_names: list,
        benchmark: bool = False,
    ):
        self.agent = LLMCompilerAgent(agent_llm)
        self.joinner_prompt = joinner_prompt
        self.joinner_prompt_final = joinner_prompt_final or joinner_prompt
        self.message_manager = message_manager
        self.user_id = user_id
        self.ticker_name = ticker_name
        self.other_mentioned_ticker_names = other_mentioned_ticker_names
        self.benchmark = benchmark
        self.executor_callback = None
        
        if benchmark:
            from .callbacks import AsyncStatsCallbackHandler
            self.executor_callback = AsyncStatsCallbackHandler(stream=False)

    async def execute_tasks(self, tasks: Dict[int, Task], input_query: str) -> str:
        """
        Execute the given tasks and return the final answer
        """
        task_fetching_unit = TaskFetchingUnit()
        task_fetching_unit.set_tasks(tasks)
        await task_fetching_unit.schedule()
        
        # Collect thought-action-observation
        agent_scratchpad = "\n\n"
        agent_scratchpad += "".join(
            [
                task.get_though_action_observation(
                    include_action=True, include_thought=True
                )
                for task in tasks.values()
                if not task.is_join
            ]
        )
        agent_scratchpad = agent_scratchpad.strip()
        log("Agent scratchpad:\n", agent_scratchpad, block=True)

        await self.message_manager.send_message("Preparing answer")
        thought, answer, _ = await self._join(
            input_query,
            agent_scratchpad=agent_scratchpad,
            is_final=True,
        )

        if answer != NO_ANWER_REPLY:
            processor = DataProcessor(
                agent=self.agent, 
                executor_callback=[self.executor_callback], 
                benchmark=self.benchmark
            )
            answer = await processor.convert_to_markdown(answer)
            # answer = processor.replace_graph_placeholders(answer, tasks)
            log_task_execution(
                self.user_id, 
                self.ticker_name, 
                self.other_mentioned_ticker_names, 
                tasks, 
                answer
            )

        return answer

    async def _join(
        self, 
        input_query: str, 
        agent_scratchpad: str, 
        is_final: bool
    ) -> tuple[str, str, bool]:
        """
        Join the results of task execution into a coherent answer
        """
        joinner_prompt = self.joinner_prompt_final if is_final else self.joinner_prompt
        prompt = (
            f"{joinner_prompt}\n"
            f"Question: {input_query}\n\n"
            f"{agent_scratchpad}\n"
        )
        
        response = await self.agent.arun(
            prompt, 
            callbacks=[self.executor_callback] if self.benchmark else None
        )
        
        log("Question: \n", input_query, block=True)
        log("Raw Answer: \n", response, block=True)
        
        thought, answer, is_replan = self._parse_joinner_output(response)
        
        if is_final and is_replan:
            answer = NO_ANWER_REPLY
            is_replan = False
            
        return thought, answer, is_replan

    def _parse_joinner_output(self, raw_answer: str) -> tuple[str, str, bool]:
        """Parse the joinner output format:
        ```
        Thought: xxx
        Action: Finish/Replan(yyy)
        ```
        """
        thought, answer, is_replan = "", "", False
        raw_answers = raw_answer.split("\n")
        capture_answer = False
        answer_parts = []
        open_paren_count = 0

        for ans in raw_answers:
            if ans.startswith("Thought:"):
                thought = ans.split("Thought:")[1].strip()
            elif ans.startswith("Action:"):
                if "Finish" in ans or "Replan" in ans:
                    capture_answer = True
                    is_replan = "Replan" in ans
                    open_paren_count += ans.count("(")
                    answer_parts.append(ans[ans.find("(") + 1:])
            elif capture_answer:
                answer_parts.append(ans.strip())
                open_paren_count += ans.count("(") - ans.count(")")
                if open_paren_count <= 0:
                    capture_answer = False
                    answer_parts[-1] = answer_parts[-1][:answer_parts[-1].rfind(")")]

        answer = " ".join(answer_parts).strip()
        return thought, answer, is_replan

    def get_stats(self):
        """Return execution statistics if benchmarking is enabled"""
        if self.benchmark and self.executor_callback:
            return self.executor_callback.get_stats()
        return {}