//handles requests and API calls
//the index.js has to look at the url and forward the request to the correct place
import {ChatMemory} from "./durable_object/ChatMemory.js";

export {ChatMemory};

export default {

    async fetch(request, env) {
        var url = new URL(request.url);
        
        //these CORS headers I got from ChatGPT allowing the broswer to talk to this worker from any domain
        //without these, browsers block requests from different origins
        var corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (url.pathname === "/chat/") {
            var sessionId = url.pathname.split("/")[2]; //index 2 is the session id
            if (!sessionId) {
                return new Response("Missing session ID", {status: 400, headers: corsHeaders });
            }

            
    }
}