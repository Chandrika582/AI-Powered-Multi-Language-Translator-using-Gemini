"""
AI-Powered Multi-Language Translator using Google Gemini
========================================================
A Flask web application that leverages Google's Gemini Generative AI
to provide accurate, context-aware translations across 30+ languages.

Track: Google Generative AI
"""

import os
import time
import requests as http_requests
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Load environment variables from .env in the same directory as this script
load_dotenv(Path(__file__).resolve().parent / ".env")

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Please set it in the .env file.")

print(f"[INFO] API Key loaded (length={len(GEMINI_API_KEY)})")

MODEL_ID = "gemini-2.5-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_ID}:generateContent"


def call_gemini(prompt):
    """Call Gemini API using REST endpoint directly."""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    print(f"[DEBUG] Calling Gemini API, key length={len(GEMINI_API_KEY)}, key starts={GEMINI_API_KEY[:10]}")
    response = http_requests.post(
        url,
        json=payload,
        timeout=60,
    )
    print(f"[DEBUG] Response status: {response.status_code}")
    if response.status_code != 200:
        print(f"[DEBUG] Error response: {response.text[:500]}")
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


# Flask app
app = Flask(__name__)

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "ar": "Arabic",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "ur": "Urdu",
    "th": "Thai",
    "vi": "Vietnamese",
    "tr": "Turkish",
    "pl": "Polish",
    "nl": "Dutch",
    "sv": "Swedish",
    "da": "Danish",
    "fi": "Finnish",
    "el": "Greek",
    "he": "Hebrew",
    "id": "Indonesian",
    "ms": "Malay",
    "sw": "Swahili",
}


@app.route("/")
def index():
    """Render the main translator page."""
    return render_template("index.html", languages=SUPPORTED_LANGUAGES)


@app.route("/translate", methods=["POST"])
def translate():
    """Translate text using Gemini AI."""
    try:
        data = request.get_json()
        text = data.get("text", "").strip()
        source_lang = data.get("source_lang", "auto")
        target_lang = data.get("target_lang", "en")

        if not text:
            return jsonify({"error": "No text provided for translation."}), 400

        if len(text) > 5000:
            return jsonify({"error": "Text exceeds 5000 character limit."}), 400

        target_language_name = SUPPORTED_LANGUAGES.get(target_lang, "English")

        if source_lang == "auto":
            source_info = "Auto-detect the source language"
        else:
            source_language_name = SUPPORTED_LANGUAGES.get(source_lang, "Unknown")
            source_info = f"The source language is {source_language_name}"

        prompt = f"""You are an expert multilingual translator. Translate the following text to {target_language_name}.

Instructions:
- {source_info}
- Provide ONLY the translated text, nothing else
- Maintain the original formatting, tone, and meaning
- Handle idioms and cultural expressions appropriately
- If the text contains technical terms, translate them accurately
- Preserve any numbers, proper nouns, and special characters
- Do not add any explanations, notes, or extra text

Text to translate:
{text}"""

        translated_text = call_gemini(prompt)

        return jsonify({
            "translated_text": translated_text,
            "source_lang": source_lang,
            "target_lang": target_lang,
        })

    except http_requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            return jsonify({"error": "Rate limit exceeded. Please wait a moment and try again."}), 429
        return jsonify({"error": f"Translation failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Translation failed: {str(e)}"}), 500


@app.route("/detect", methods=["POST"])
def detect_language():
    """Detect the language of input text using Gemini AI."""
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "No text provided."}), 400

        prompt = f"""Detect the language of the following text.
Respond with ONLY the language name (e.g., "English", "Spanish", "Hindi"), nothing else.

Text: {text}"""

        detected_language = call_gemini(prompt)

        # Map detected language name back to code
        lang_code = "unknown"
        for code, name in SUPPORTED_LANGUAGES.items():
            if name.lower() == detected_language.lower():
                lang_code = code
                break

        return jsonify({
            "detected_language": detected_language,
            "language_code": lang_code,
        })

    except http_requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            return jsonify({"error": "Rate limit exceeded. Please wait a moment and try again."}), 429
        return jsonify({"error": f"Language detection failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Language detection failed: {str(e)}"}), 500


@app.route("/improve", methods=["POST"])
def improve_translation():
    """Provide alternative/improved translations with context."""
    try:
        data = request.get_json()
        text = data.get("text", "").strip()
        target_lang = data.get("target_lang", "en")
        context = data.get("context", "general")

        if not text:
            return jsonify({"error": "No text provided."}), 400

        target_language_name = SUPPORTED_LANGUAGES.get(target_lang, "English")

        prompt = f"""You are an expert multilingual translator. Provide 3 alternative translations of the following text to {target_language_name}.

Context: This text is used in a {context} context.

For each alternative, provide:
1. The translation
2. A brief note on when this variant is most appropriate

Format your response as:
1. [Translation 1] — [Note]
2. [Translation 2] — [Note]
3. [Translation 3] — [Note]

Text to translate:
{text}"""

        alternatives = call_gemini(prompt)

        return jsonify({
            "alternatives": alternatives,
            "target_lang": target_lang,
        })

    except http_requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            return jsonify({"error": "Rate limit exceeded. Please wait a moment and try again."}), 429
        return jsonify({"error": f"Failed to generate alternatives: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to generate alternatives: {str(e)}"}), 500


@app.route("/languages", methods=["GET"])
def get_languages():
    """Return the list of supported languages."""
    return jsonify({"languages": SUPPORTED_LANGUAGES})


@app.route("/debug", methods=["GET"])
def debug_info():
    """Debug endpoint to test API connectivity."""
    try:
        key = GEMINI_API_KEY
        url = f"{GEMINI_API_URL}?key={key}"
        payload = {"contents": [{"parts": [{"text": "Say hi"}]}]}
        r = http_requests.post(url, json=payload, timeout=30)
        return jsonify({
            "key_length": len(key),
            "key_prefix": key[:10],
            "url_used": GEMINI_API_URL,
            "status_code": r.status_code,
            "response_preview": r.text[:200],
        })
    except Exception as e:
        return jsonify({"error": str(e), "key_length": len(GEMINI_API_KEY), "key_prefix": GEMINI_API_KEY[:10]})


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)
