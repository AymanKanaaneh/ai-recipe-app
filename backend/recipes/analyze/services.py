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
    You are a professional chef AI specializing in recognizing meals from images and suggesting suitable recipes.

    Analyze the provided meal image carefully and do the following:
    1. Identify and list the main visible ingredients (e.g., meats, vegetables, sauces, grains, toppings).
    2. Suggest one realistic, complete recipe that best matches the meal in the image.
       Include the recipe name, ingredients, and step-by-step instructions.
    3. Provide the output strictly in the requested JSON format.
    4. Keep ingredient and instruction text clear, natural, and ready for display — no special tokens, markdown, or extra formatting.
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


def handle_recipe_question(client: genai.Client, recipe_data: Dict[str, Any], recipe_query: str) -> Dict[str, Any]:
    recipe_context = json.dumps(recipe_data, indent=2)
    text_prompt = (
    "You are a professional chef assistant helping a user with questions about this specific recipe:\n"
    f"{recipe_context}\n\n"
    f"User's question: {recipe_query}\n\n"
    "Your task:\n"
    "- Give a clear, friendly, and detailed answer to the user’s question.\n"
    "- If relevant, explain cooking steps, substitutions, nutrition tips, or adjustments.\n"
    "- If the user requests changes (e.g., dietary preferences, missing ingredients, flavor adjustments), "
    "include a modified version of the recipe under the field 'modified_recipe', keeping the same structure.\n"
    "- Keep your tone natural and encouraging, as if chatting with a home cook.\n"
    "- Return the answer as natural, human-readable text — do not include any code, tokens, brackets, or formatting syntax "
    "(like JSON, Markdown, or quotation marks). Just provide clean text ready to be read aloud."
    )


    config = GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=Schema(
            type=Type.OBJECT,
            properties={
                "answer": Schema(type=Type.STRING, description="Detailed response to user's question"),
                "modified_recipe": Schema(
                    type=Type.OBJECT,
                    description="Optional modified recipe if requested",
                    properties={
                        "identified_ingredients": Schema(type=Type.ARRAY, items=Schema(type=Type.STRING)),
                        "suggested_recipe_name": Schema(type=Type.STRING),
                        "prep_time_minutes": Schema(type=Type.INTEGER),
                        "instructions": Schema(type=Type.ARRAY, items=Schema(type=Type.STRING)),
                    },
                    required=[]  # All fields optional since modification may not be needed
                )
            },
            required=["answer"],
        ),
    )

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[text_prompt],
        config=config,
    )
    return json.loads(response.text)


