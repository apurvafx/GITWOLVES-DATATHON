import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("API Key not found.")
else:
    print(f"Using API Key: {api_key[:6]}...{api_key[-4:]}")
    genai.configure(api_key=api_key)
    try:
        models = genai.list_models()
        print("Available models:")
        for m in models:
            print(f" - {m.name} (supports: {m.supported_generation_methods})")
    except Exception as e:
        print(f"Error listing models: {e}")
