//Previous chat memory that is stored in the durable object file
//using cloudflare's durable object API to create a small server like object that stays alive between requests to the LLM's API

export class ChatMemory {
    //cloudclare needs to pass in the state allowing us to use storage and websockets and an environment allowing the use of AI and other bindings from wrangle.toml
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }



    //just like a server, fetch is called every time a request is made
    //it needs to have a url which decides what to do
    async fetch(request) {
        var url = new URL(request.url);
        //deciding what to do 
        //if the url is upgrade, we'll return the function made for that
        if (request.headers.get("Upgrade") === "websocket") {
            return this.handleWebSocket(request);
        }
        //if the url's pathname is /history
        if (url.pathname === "/history") {
            return this.getHistory(request);
        }
        //if the url wants to clear the chat
        if (url.pathname === "/clear") {
            return this.clearHistory();
        }
        
        //anything else will return 404 error
        return new Response("Not found", { status: 404 });
    }



    //the functions that will handle the different requests
    async handleWebSocket(request) {
    }

    async getHistory(request) {
    }

    async clearHistory() {
    }
}