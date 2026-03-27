ALTER TABLE "recipes" DROP CONSTRAINT IF EXISTS "recipes_event_id_fkey";
ALTER TABLE "recipe_components" DROP CONSTRAINT IF EXISTS "recipe_components_recipe_id_fkey";
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT IF EXISTS "recipe_ingredients_component_id_fkey";
ALTER TABLE "recipe_steps" DROP CONSTRAINT IF EXISTS "recipe_steps_recipe_id_fkey";

DROP TABLE IF EXISTS "recipe_ingredients";
DROP TABLE IF EXISTS "recipe_steps";
DROP TABLE IF EXISTS "recipe_components";
DROP TABLE IF EXISTS "recipes";

DROP TYPE IF EXISTS "Course";
