from django.urls import path
from .views import generate_recipe_view as analyze_generate_view

urlpatterns = [
    path('generate/', analyze_generate_view, name='generate_recipe'),
]


