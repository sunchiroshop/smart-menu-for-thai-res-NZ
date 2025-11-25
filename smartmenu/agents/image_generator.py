from smartmenu.utils.openai_client import get_openai_client

def generate_food_image(dish_name):
    client = get_openai_client()
    prompt = f"Realistic, vibrant food photograph of {dish_name}, Thai cuisine, studio lighting."

    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024"
    )

    image_base64 = result.data[0].b64_json
    return image_base64
