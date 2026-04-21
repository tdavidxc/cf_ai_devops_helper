# CF AI DevOps Helper

An AI-powered DevOps chat assistant built on Cloudflare. Ask it anything about CI/CD, deployments, infrastructure, and cloud operations. The model connects to Cloudflare  and utilises Llama 3.3 to engage in continuous conversations with developers requiring assistance with any CI/CD related issues.

## How it works

| Piece    | Cloudflare product     | What it does                                                                                    |
| -------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| AI model | Workers AI (Llama 3.3) | Generates the responses in block streams                                                        |
| Memory   | Durable Objects        | Stores each user's chat history, with the ability to clear, read and write onto existing memory |
| Backend  | Workers                | Routes requests (acting as middlemen between frontend and the AI and memory system)             |
| Frontend | Static HTML/JS         | The chat UI in the browser                                                                      |

## Project structure

```
cf_ai_devops_helper/
├── durable-object/
│   └── ChatMemory.js   # stores messages + handles WebSocket + calls AI
├── frontend/
│   ├── index.html      # the chat page
│   └── app.js          # browser-side logic
├── worker/
│   └── index.js        # request router
├── wrangler.toml       # Cloudflare config
├── README.md
└── PROMPTS.md
```

## Running locally

**You need:**

* Node.js 18 or newer
* A free Cloudflare account
* Wrangler CLI: `npm install -g wrangler`

**Steps:**

```bash
# 1. Clone the repo and go into it
git clone <your-repo-url>
cd cf_ai_devops_helper

# 2. Log in to Cloudflare from the link generated from the below input in your terminal
wrangler login

# 3. Start the worker
wrangler dev --remote

# 4. In a separate terminal, start the frontend
npx wrangler pages dev frontend --proxy 8787

#5. Then open the frontend on http://localhost:8788 (NOT on 8787)
#You can also enter 'b' in the terminal if the popup appears to open on browser
```

## Deploying

```bash
wrangler deploy
npx wrangler pages deploy frontend --project-name cf-ai-devops-helper
```

After deploying, change `WORKER_URL` at the top of `frontend/app.js` from `ws://localhost:8787` to your live worker URL (e.g. `wss://cf-ai-devops-helper.yourname.workers.dev`), then redeploy the frontend.
