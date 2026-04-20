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
            return this.getHistory();
        }
        //if the url wants to clear the chat
        if (url.pathname === "/clear") {
            return this.clearHistory();
        }
        
        //anything else will return 404 error
        return new Response("Not found", { status: 404 });
    }



    //the functions that will handle the different requests
    //a websocket is a connection that stays open 
    //this is how messages will be sent to the LLM and responses will be sent back to the client without needing to make a new request every time
    async handleWebSocket(request) {
        //it first needs to create the connection
        var pair = new WebSocketPair();
        var client = pair[0];
        var server = pair[1];

        //now using Cloudflare's Durable Object system to manage this connection
        //Cloudclare will call websocketMessage() when a message arrives
        this.state.acceptWebSocket(server);
        //according to examples and web socket acceptance i need to switch protocols to the websocket one from http or https
        return new Response(null, {status: 101, webSocket: client});
    }

    //because webSocketMessage() is automatically called by Cloudflare, that method needs to be implemented
    //not sure what this has to do for now
    async webSocketMessage(websocket, message) {
        return
    }

    //now writing loadAllMessages() which has to read the saved message list from storage. It has to return an empty array if nothing has been saved yet
    async loadAllMessages() {
        var messages = await this.state.storage.get("messages");
        if (messages === undefined) {
            return [];
        }
        //otherwise return messages
        return messages;
    }


    //returns all stored messages as a JSON response.
    async getHistory() {
        var messages = away this.loadAllMessages(); //a helper method to load all the messages from storage
        //response.json automatically stringifies and sets it to application/json
        return Response.json({messages: messages});
    }
    
    //deletes all stored messages
    async clearHistory() {
        await this.state.storage.delete("messages");
        //same here with the response.json
        return Response.json({ok : true});
    }
}