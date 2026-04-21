AI/LLM Prompts used during this project [disclaimer: the project was heavily coded with ChatGPT and Claude as AI assisted development was encouraged, I still refrained from trusting these generated codes to be safe and reliable. I cross-checked everything line-by-line, not only understanding the code but also ensuring the safety of the generated code, especially when it would and could be handling insensitive data"

**ChatGPT (5)**

"For this project, what could be some possible ideas that I can implement tailored to a devops / software engineering workflow?"

"Is wrangler.toml, with a frontend, worker and 'durable-object' repo structure a solid starting point for this project?"

"what is the difference between app.js in my frontend vs index.js in my worker respectively?"

"Is it better to have chatbot memory in a json file or a .js file and tell me why"

- All conversations above this had basic responses that helped me understand the project and guidelines better.

"give me a basic .gitignore file for this project that uses node gitignore"

"no, write the actual .gitignore file for me using the screenshot of the project structure and the existing .gitignore content provided by GitHub"

- gave me a working .gitignore file that I can use. After checking through the file I considered it worthy and reliable for this project

"give me some tutorials + guidance + places I can learn to start making this project. Give me real sources, not hallucinated ones"

"Wahat are all the status codes I need to know for this"

- gave me some status codes required like 404 etc.

"how do I handle Llama API's response stream to store all previous conversations?"

    - Stream

"What are cors headers and how do I implement them in index.js?"

"Give me tricks on how to edit .md files properly to create a good README.md file with tables and code blocks. Also give me a diagram for the layout of my project structure that I can add on"

"Give me a README.md block on how the project can be deployed too"

**Claude**

I gave claude a skeleton code for the front-end asking it to fix the colours, syntax and visual layout.

"Using the skeleton code and the design seen in the screenshot, create a front-end in html allowing devops engineers to communicate with a backend "app.js". Keep in mind the users will be talking to Llama so input will be parsed in block streams so accomodate for spacing with the text boxes. Allow the user to input, send and clear text at the bottom. Also add a small notifier to notify the user if connection to the server is good or gone."

Claude returned a working html file seen in index.html that works effectively to communicate with the model. After some fine tuning with structure and colours, I feel it to be a safe, reliable and effective front-end for this project.


For the index.js, I gave claude this prompt:


"

for the previous front-end html file and the attached chatmemory.js file, give me a basic index.js file that can handle CORS with options requests, route the following:

- /chat/:sessionId to a durable object for web socket handling
- /history/:sessionId to fetch stored messages from the durable object
- /clear/:sessionId to clear stored messages

and uses idFromName() to map session IDs to durable object instances, forwarding requests to the durable object using stub.fetch(). it needs to be compatible with cloudflare's resources, using Llama as a backend model. This is just context. Comment the code so I understand what is going on each line

"
It returned a somewhat working index.js file filled with comments (That I have kept in). There were some Assertion failures that occured with the code, but this was fixed by adding format = "modules onto the wrangler.toml file.
NOTE: the given code had a security vulnerability with the sessionID. Anyone with the sessionID could gain access to chat history and delete messages. As this project is just to show how I can use AI assisted coding to create a llama backend, workflow coordinated text based AI chatbot using cloudflare's servers, I figured this is not a big deal. However, if migrating to a real system, this would need a workaround.


Moving onto app.js, I gave claude the following prompt:

"Help me complete app.js which talks to a backend Llama over WebSockets. I need to connect the front-end index.html, the index.js from earlier and also with updating the UI with streams of responses by the Llama model. I need to store the session Id in localStorage and be able to load and clear chat history with fetch. To connect to a websocket endpoint, it needs to use /chat/:sessionId like the documentation attached. It needs to update indicators to the user to show whether you're waiting for the model to respond, showing connectivity and fetch previous messages from /history/:sesssionId and clear chat using /clear/:sessionId -> all in chatmemory.js."

Claude returned a file that did not run properly with the existing structure. However, working through the issues and reading the comments that claude added after another prompt, I was able to trace an issue with disconnectivity that happens with cloudflare if you don't reconnect often. I simply edited ws.onclose to reconnect after a 2 second wait.



In conclusion, app.js, index.js and html.js were heavily coded using claude and GPT, with modifications error corrections and safety oversights from me. ChatMemory was written more by me with help from the LLMs on syntax and structure.
