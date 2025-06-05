import os
import sys
sys.path.append('../../')
from metadataTemplates import *
import json
from src.pipeline3.apiManager import ApiManager
from langchain_community.chat_models import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI

def llm_json_to_dict(llm_output):
    try:
        # Try to parse the LLM output as JSON
        return json.loads(llm_output)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        
        # If parsing fails, try to clean the string and parse again
        cleaned_output = clean_json_string(llm_output)
        try:
            return json.loads(cleaned_output)
        except json.JSONDecodeError:
            print("Failed to parse JSON even after cleaning.")
            return llm_output

def clean_json_string(s):
    # Remove any leading/trailing whitespace
    s = s.strip()
    
    # Ensure the string starts and ends with curly braces
    if not s.startswith('{'): s = '{' + s
    if not s.endswith('}'): s = s + '}'
    
    # Replace single quotes with double quotes
    s = s.replace("'", '"')
    
    # Handle potential unquoted keys
    s = re.sub(r'(\w+)(?=\s*:)', r'"\1"', s)
    
    return s

def create_llm(api_manager):
    return ChatGoogleGenerativeAI(model="gemini-pro", temperature=0, google_api_key=api_manager.get_key('GOOGLE_API_KEY'))
    return ChatAnthropic(
        model="claude-3-sonnet-20240229",
        temperature=0,
        max_tokens=150,
        anthropic_api_key=api_key
    )

# Create a prompt template for generating the summary
summary_prompt = ChatPromptTemplate.from_messages([
    ("human", "generate metadata in json format for the following content:\n\n{file_content}\n{meta_data_format_example}\n{document_type_constraint}\n {macro_economic_sectors_constraint}\n {sectors_constraint}\n {basic_industries_constraint}")
])

def process_file(file_path, summary_chain):
    # Get file information
    file_stats = os.stat(file_path)
    file_name = os.path.basename(file_path)
    file_type = os.path.splitext(file_name)[1]

    # Read file content
    if file_type.lower() == '.pdf':
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        
        # Combine all pages into a single string
        content = "\n".join([page.page_content for page in pages])
        
        # Use a text splitter to limit the content length if necessary
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=100000,#increase it for adding more of the content if pdf is large
            chunk_overlap=0,
            length_function=len
        )
        chunks = text_splitter.split_text(content)
        content = chunks[0] if chunks else ""
    else:  # For non-PDF files, use the original method
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()[:100000]  # Use first 1000 characters

    # Generate summary using Claude 3.5 Sonnet
    summary = summary_chain.run(file_content=content,meta_data_format_example=meta_data_format_example,
                                document_type_constraint=document_type_constraint,macro_economic_sectors_constraint=macro_economic_sectors_constraint,
                                sectors_constraint=sectors_constraint,basic_industries_constraint=basic_industries_constraint)

    # Create metadata
    metadata = {
        "filename": file_name,
        "file_type": file_type,
        "file_size": file_stats.st_size,
        "created_date": file_stats.st_ctime,
        "last_modified_date": file_stats.st_mtime,
        "file_metadata_by_llm": llm_json_to_dict(summary.strip())
    }

    return metadata

def get_original_meta_filenames(directory):
    original_names = set()
    
    for filename in os.listdir(directory):
        if filename.endswith('_metadata.json'):
            file_path = os.path.join(directory, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    metadata = json.load(file)
                    if 'filename' in metadata:
                        original_names.add(metadata['filename'])
                    else:
                        print(f"Warning: 'filename' key not found in {filename}")
            except json.JSONDecodeError:
                print(f"Error: Unable to parse JSON in {filename}")
            except Exception as e:
                print(f"Error reading {filename}: {str(e)}")
    
    return original_names
def main(target_folder, metadata_folder, api_manager):
    # Create metadata folder if it doesn't exist
    os.makedirs(metadata_folder, exist_ok=True)

    # Create the LLM and summary chain
    llm = create_llm(api_manager)
    summary_chain = LLMChain(llm=llm, prompt=summary_prompt)
    existing_metas = get_original_meta_filenames(metadata_folder)
    for filename in os.listdir(target_folder):
        if filename.endswith(('.pdf', '.txt')) and filename not in existing_metas:
            file_path = os.path.join(target_folder, filename)
            metadata = process_file(file_path, summary_chain)

            # Write metadata to JSON file in the metadata folder
            json_filename = f"{os.path.splitext(filename)[0]}_metadata.json"
            json_path = os.path.join(metadata_folder, json_filename)
            with open(json_path, 'w', encoding='utf-8') as json_file:
                json.dump(metadata, json_file, indent=4)

            print(f"Processed {filename} and created {json_filename} in {metadata_folder}")

if __name__ == "__main__":
    target_folder = "../../data/macroData/raw/"
    metadata_folder = "../../data/macroData/metaData/"
    api_manager = ApiManager()
    main(target_folder, metadata_folder, api_manager)