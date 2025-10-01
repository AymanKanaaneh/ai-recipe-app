import json
from io import BytesIO
from typing import Any, Dict

from PIL import Image
from google import genai
from google.genai.types import GenerateContentConfig, Schema, Type


def build_recipe_schema() -> Schema:
    return Schema(
        type=Type.OBJECT,
        properties={
            "identified_ingredients": Schema(
                type=Type.ARRAY,
                description="List the key ingredients visible in the image.",
                items=Schema(type=Type.STRING),
            ),
            "suggested_recipe_name": Schema(
                type=Type.STRING,
                description="A creative name for the suggested recipe.",
            ),
            "prep_time_minutes": Schema(
                type=Type.INTEGER,
                description="Estimated preparation time in minutes.",
            ),
            "instructions": Schema(
                type=Type.ARRAY,
                description="Step-by-step instructions for the recipe.",
                items=Schema(type=Type.STRING),
            ),
        },
        required=["identified_ingredients", "suggested_recipe_name", "instructions"],
    )


def generate_recipe_from_image_bytes(client: genai.Client, image_bytes: bytes) -> Dict[str, Any]:
    image = Image.open(BytesIO(image_bytes))
    text_prompt = (
        """
        Analyze the contents of this image.
        First, list all the main ingredients you see.
        Second, Suggest one complete recipe that could realistically match this meal.
        Provide the output strictly in the requested JSON format.
        """
    )

    config = GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=build_recipe_schema(),
    )

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[image, text_prompt],
        config=config,
    )
    return json.loads(response.text)


