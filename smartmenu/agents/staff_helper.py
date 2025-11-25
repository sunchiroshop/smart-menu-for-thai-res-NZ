from smartmenu.utils.openai_client import get_openai_client

def staff_answer(question, menu):
    client = get_openai_client()
    prompt = f"""
You are a staff assistant in a Thai restaurant in New Zealand.

Menu:
{menu}

Customer question:
{question}

Give a short, clear English answer a waiter can say.
If allergens or spice level are relevant, explain them briefly.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
