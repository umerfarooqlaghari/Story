from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import httpx
import uuid
from .config import supabase, ELEVENLABS_API_KEY, OPENAI_API_KEY
from openai import AsyncOpenAI

app = FastAPI(title="Story API")
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

class StoryRequest(BaseModel):
    user_id: str
    theme: str

@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    # 1. Generate Story Text via LLM
    try:
        completion = await openai_client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a creative children's book author. Write a short, engaging bedtime story (max 300 words)."},
                {"role": "user", "content": f"Write a bedtime story about: {request.theme}"}
            ]
        )
        story_text = completion.choices[0].message.content
        title = f"A story about {request.theme}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation failed: {str(e)}")

    # 2. Convert Text to Speech (ElevenLabs)
    voice_id = "21m00Tcm4TlvDq8ikWAM" # Replace with a friendly voice ID
    elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": story_text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(elevenlabs_url, json=data, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="TTS Generation failed")
        audio_content = response.content

    # 3. Upload to Supabase Storage
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    file_path = f"{request.user_id}/{uuid.uuid4()}.mp3"
    try:
        supabase.storage.from_("stories").upload(
            path=file_path,
            file=audio_content,
            file_options={"content-type": "audio/mpeg"}
        )
        audio_url = supabase.storage.from_("stories").get_public_url(file_path)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # 4. Save to Database
    story_data = {
        "user_id": request.user_id,
        "title": title,
        "content": story_text,
        "audio_url": audio_url
    }
    
    try:
        db_response = supabase.table("stories").insert(story_data).execute()
        return db_response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")
