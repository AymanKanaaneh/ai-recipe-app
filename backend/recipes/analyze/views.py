import json
import os
from io import BytesIO
from PIL import Image
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

# Google GenAI SDK
from google import genai
from .services import generate_recipe_from_image_bytes


def _get_genai_client() -> genai.Client:
    api_key = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError('Missing GOOGLE_API_KEY (or GEMINI_API_KEY) in environment')
    return genai.Client(api_key=api_key)


@csrf_exempt
def generate_recipe_view(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({"detail": "Only POST is allowed"}, status=405)

    uploaded_file = request.FILES.get('image')
    if not uploaded_file:
        return JsonResponse({"detail": "Missing 'image' in form-data"}, status=400)

    try:
        image_bytes = uploaded_file.read()
        img = Image.open(BytesIO(image_bytes))
    except Exception:
        return JsonResponse({"detail": "Invalid image file"}, status=400)

    try:
        client = _get_genai_client()
        data = generate_recipe_from_image_bytes(client, image_bytes)
        return JsonResponse(data, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Model returned non-JSON response"}, status=502)
    except Exception as exc:
        return JsonResponse({"detail": str(exc)}, status=500)
