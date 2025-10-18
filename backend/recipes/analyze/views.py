import json
import os
from io import BytesIO
from PIL import Image
from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

# Google GenAI SDK
from google import genai
from .services import generate_recipe_from_image_bytes, handle_recipe_question


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


@csrf_exempt
def handle_recipe_query_view(request: HttpRequest):
    if request.method != 'POST':
        return JsonResponse({"detail": "Only POST is allowed"}, status=405)

    try:
        body_data = json.loads(request.body.decode('utf-8'))
        recipe_query = body_data.get('query')
        recipe_data = body_data.get('recipe_data')
        
        if not recipe_query:
            return JsonResponse({"detail": "Missing 'query' in request JSON"}, status=400)
        if not recipe_data:
            return JsonResponse({"detail": "Missing 'recipe_data' in request JSON"}, status=400)
            
        client = _get_genai_client()
        data = handle_recipe_question(client, recipe_data, recipe_query)
        return JsonResponse(data, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON in request"}, status=400)
    except Exception as exc:
        return JsonResponse({"detail": str(exc)}, status=500)
