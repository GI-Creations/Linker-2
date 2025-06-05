class DataProcessor:
    def __init__(self, agent, executor_callback=None, benchmark=False):
        from src.pipeline3.compiler.llm_compiler import LLMCompilerAgent
        if not isinstance(agent, LLMCompilerAgent):
            agent = LLMCompilerAgent(agent)
        self.agent = agent
        self.executor_callback = executor_callback
        self.benchmark = benchmark

    async def convert_to_markdown(self, raw_output):
        markdown_prompt = f"""You are an expert at converting given text into Markdown format. 
            Your task is to strictly convert the provided text into Markdown syntax without omitting, altering, or rephrasing any part of the content. 
            Ensure the following Markdown guidelines are followed precisely:

            - Headers: Use `#`, `##`, `###`, etc., for headings.
            - Lists: Use `-` or `*` for unordered lists, and numbers for ordered lists.
            - Bold and Italics: Use `**` for bold and `*` for italics.
            - Code Blocks: Use triple backticks (```) for code blocks.
            - Tables: Format tabular data using `|` and `-`.
            - Links: Format links using `[text](url)`.
            - Images: Format images using `![Generated Image](image)` Here image can be of form graph(idx).

            Important Notes:
            - Do not omit any part of the original content. If there is specific text or placeholders, ensure they are retained as-is.
            - Do not add any extra information or modify the meaning of the content.
            - Any textual, graphical, or placeholder content must be preserved in its original form.

            Raw text:
            {raw_output}

            Markdown format of Raw text:
            """

        response = await self.agent.arun(
            markdown_prompt, callbacks=[self.executor_callback] if self.benchmark else None
        )
        markdown_output = str(response)
        return markdown_output