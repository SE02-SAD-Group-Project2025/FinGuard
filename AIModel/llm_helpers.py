import requests

def generate_local_llm_response(prompt: str, model: str = "llama3"):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": model, "prompt": prompt, "stream": False}
    )
    return response.json().get('response', "No response from LLM.")
