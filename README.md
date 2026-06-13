# 🐟 Fishify: AI Music Recommender

**Fishify** is a web application that provides personalized music recommendations.  
Just describe your **mood**, an **activity**, or mention a **song/artist** you like — and our AI will generate a list of 10 songs curated just for you.

---

## 🚀 How It Works

The magic behind Fishify combines a **Next.js frontend**, an **AI backend powered by Genkit (Groq)**, and the **free iTunes Search API**.  
Here’s how the flow works:

1. **📝 User Input**  
   The user enters a prompt (e.g., `"music for a rainy day"`) on the homepage and clicks the search button.

2. **🧠 AI Request (via Genkit)**  
   The app sends the prompt to the Genkit AI backend. Genkit uses an advanced language model to understand the context and return a list of 10 suitable **song titles and artists**.

3. **🎧 iTunes Data Enrichment**  
   For each AI-suggested song, the app queries the **iTunes Search API** (free, no key) to fetch:
   - Album cover image  
   - Apple Music track link  
   - Song duration  
   - 30-second audio preview URL (if available)

4. **📱 Display Results**  
   The enriched data is sent back to the frontend.  
   The user sees a clean list of recommendations with a built-in audio player for previewing each song.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, TypeScript  
- **Backend AI**: Genkit + Groq (llama-3.3-70b)  
- **Music API**: iTunes Search API (free, no key)  
- **Deployment**: Vercel 

---

## 💡 Example Prompt Ideas

- `"music to help me focus"`  
- `"songs like Arctic Monkeys"`  
- `"calm music for night drives"`  
- `"energetic music for working out"`  
- `"melancholic indie tracks"`

---

## ⚠️ Limitations

- Not all tracks have a preview on iTunes. These are skipped or shown as "preview not available".
- AI suggestions are based on text interpretation, not your listening history (yet 😉).

---


**Enjoy discovering music with Fishify! 🎶**
