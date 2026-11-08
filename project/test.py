import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Text models that support chat, preferring "flash" (fast and free-tier friendly)
candidates = []
for m in client.models.list():
    actions = getattr(m, "supported_actions", None) or []
    name = m.name.replace("models/", "")
    if "generateContent" in actions and "flash" in name and not any(
        bad in name for bad in ("live", "image", "tts", "audio", "robotics", "embedding")
    ):
        candidates.append(name)

print("Flash models found:", candidates)

for name in candidates[:8]:
    try:
        r = client.models.generate_content(model=name, contents="Say hi")
        print(f"\nWORKS -> {name}: {r.text}")
        break
    except Exception as e:
        print(f"\nFAILED -> {name}: {str(e)[:150]}")