from rest_framework import serializers
from .models import Recipe

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ('id', 'user', 'title', 'recipe_ingredients', 'recipe_instructions', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'user')