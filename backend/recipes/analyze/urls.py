from django.urls import path
from .views import generate_recipe_view as analyze_generate_view, handle_recipe_query_view

urlpatterns = [
    path('generate/', analyze_generate_view, name='generate_recipe'),
    path('query/', handle_recipe_query_view, name='recipe_query'),
]


