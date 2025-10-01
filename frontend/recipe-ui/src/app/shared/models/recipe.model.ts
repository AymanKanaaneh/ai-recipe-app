export interface RecipeResult {
    identified_ingredients: string[];
    suggested_recipe_name: string;
    prep_time_minutes?: number;
    instructions: string[];
}