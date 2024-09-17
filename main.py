import os

from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # take environment variables from .env.

question = "How to setup project environment?"

service_endpoint = os.environ["AZURE_SEARCH_SERVICE_ENDPOINT"]
index_name = os.environ["AZURE_SEARCH_INDEX_NAME"]
key = os.environ["AZURE_SEARCH_API_KEY"]

search_client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))

results = search_client.search(search_text=question)
contents = [result['content'] for result in results]
context = '\n----------------\n'.join(contents)

system_template="""Use the following pieces of context to answer the users question.
Take note of the sources and include them in the answer in the format: "SOURCES: source1 source2", use "SOURCES" in capital letters regardless of the number of sources.
If you don't know the answer, just say that "I don't know", don't try to make up an answer.
----------------
{}""".format(context)

openai_client = OpenAI()
response = openai_client.chat.completions.create(
  model="gpt-4o-mini",
  messages=[
    {"role": "system", "content": system_template},
    {"role": "user", "content": question},
  ],
  temperature=1,
  max_tokens=2048,
  top_p=1,
  frequency_penalty=0,
  presence_penalty=0,
  response_format={
    "type": "text"
  }
)

print(response.choices[0].message.content)
