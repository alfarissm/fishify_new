# 🐟 Fishify: AI Music Recommender

**Fishify** is a web application that provides personalized music recommendations.  
Just describe your **mood**, an **activity**, or mention a **song/artist** you like — and our AI will generate a list of 10 songs curated just for you.

---

## 🚀 How It Works

The magic behind Fishify combines a **Next.js frontend**, an **AI backend powered by Genkit**, and the **Spotify Web API**.  
Here’s how the flow works:

1. **📝 User Input**  
   The user enters a prompt (e.g., `"music for a rainy day"`) on the homepage and clicks the search button.

2. **🧠 AI Request (via Genkit)**  
   The app sends the prompt to the Genkit AI backend. Genkit uses an advanced language model to understand the context and return a list of 10 suitable **song titles and artists**.

3. **🎧 Spotify Data Enrichment**  
   For each AI-suggested song, the app queries the **Spotify API** to fetch:
   - Album cover image  
   - Spotify track link  
   - Song duration  
   - 30-second audio preview URL (if available)

4. **📱 Display Results**  
   The enriched data is sent back to the frontend.  
   The user sees a clean list of recommendations with a built-in audio player for previewing each song.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, TypeScript  
- **Backend AI**: Genkit (Google AI SDK)  
- **Music API**: Spotify Web API  
- **Deployment**: Vercel 

---

## 📦 Installation (Coming Soon)

We'll update this section with setup instructions once the backend is finalized.

---

## 💡 Example Prompt Ideas

- `"music to help me focus"`  
- `"songs like Arctic Monkeys"`  
- `"calm music for night drives"`  
- `"energetic music for working out"`  
- `"melancholic indie tracks"`

---

## ⚠️ Limitations

- Not all Spotify songs have a `preview_url`. These will be skipped or shown as "preview not available".
- Current AI suggestions are based on text interpretation, not your Spotify history (yet 😉).

---


**Enjoy discovering music with Fishify! 🎶**
