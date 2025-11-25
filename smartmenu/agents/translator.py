from smartmenu.utils.openai_client import get_openai_client

def translate_menu(text):
    client = get_openai_client()
    prompt = f"""
You are an expert Thai → English menu translator.
Translate the following menu text accurately with proper food context.
Keep dish names natural (Pad Thai, Tom Yum, Pad Kra Pao).
Menu:
{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
