// frontend/app.js
//
// This file runs in the browser and controls the chat UI.
// It opens a WebSocket connection to the Worker, sends messages,
// and displays the AI's reply token by token as it streams in.

// --- Config ---

// This is the URL of your Cloudflare Worker.
// When running locally with "wrangler dev", the worker runs on port 8787.
// Change this to your deployed worker URL when you go live.
var WORKER_URL = "ws://localhost:8787";

// --- Session ID ---

// A session ID is a random string that identifies this browser session.
// We save it in localStorage so it survives page refreshes.
// This means the user keeps their chat history even if they reload the page.

var sessionId = localStorage.getItem("cf_devops_session");

// If there's no session ID saved yet, create a new one and save it
if (!sessionId) {
  // crypto.randomUUID() generates a random ID like "a3f2-91bc-..."
  sessionId = crypto.randomUUID();
  localStorage.setItem("cf_devops_session", sessionId);
}

// --- Variables ---

// "ws" will hold our WebSocket connection once it's open
var ws = null;

// Tracks whether the WebSocket is currently connected
var isConnected = false;

// This holds the DOM element for the message the AI is currently typing.
// We update it token by token as words stream in.
var currentAiMessageElement = null;

// --- Grab elements from the HTML ---
// These are references to the HTML elements we need to interact with.
// document.getElementById("some-id") finds the element with that id="some-id"

var messagesDiv = document.getElementById("messages");
var inputBox = document.getElementById("input");
var sendButton = document.getElementById("send-btn");
var clearButton = document.getElementById("clear-btn");
var statusDot = document.getElementById("status-dot");
var statusText = document.getElementById("status-text");
var emptyState = document.getElementById("empty-state");

// --- Connect to WebSocket ---

// This function opens a WebSocket connection to the Worker.
// A WebSocket is a persistent two-way connection —
// unlike normal HTTP, it stays open so the server can push data to us.
function connect() {

  // Build the WebSocket URL including the session ID
  // e.g. "ws://localhost:8787/chat/a3f2-91bc-..."
  var wsUrl = WORKER_URL + "/chat/" + sessionId;

  // Open the WebSocket connection
  ws = new WebSocket(wsUrl);

  // onopen runs when the connection is successfully established
  ws.onopen = function() {
    isConnected = true;

    // Update the status indicator in the UI
    statusDot.className = "connected"; // turns the dot green (see CSS)
    statusText.textContent = "Connected";

    // Enable the send button now that we're connected
    sendButton.disabled = false;

    // Load previous messages from the server
    loadHistory();
  };

  // onmessage runs every time the server sends us something
  ws.onmessage = function(event) {

    // The server sends JSON strings, so we parse them into objects
    var msg = JSON.parse(event.data);

    // "token" means a new word fragment from the AI has arrived
    if (msg.type === "token") {

      // If there's no AI message bubble yet, create one
      if (currentAiMessageElement === null) {
        removeTypingIndicator(); // remove the "..." dots
        currentAiMessageElement = addMessageToChat("assistant", "");
      }

      // Append the new token (word fragment) to the existing bubble
      currentAiMessageElement.textContent = currentAiMessageElement.textContent + msg.token;

      // Scroll down so the latest text is visible
      scrollToBottom();
    }

    // "done" means the AI has finished its full response
    if (msg.type === "done") {
      currentAiMessageElement = null; // reset so the next reply gets a fresh bubble
      sendButton.disabled = false;    // re-enable the send button
      inputBox.disabled = false;      // re-enable the input box
    }

    // "error" means something went wrong on the server
    if (msg.error) {
      removeTypingIndicator();
      addMessageToChat("assistant", "Error: " + msg.error);
      sendButton.disabled = false;
      inputBox.disabled = false;
    }
  };

  // onclose runs when the connection drops (e.g. network issue, server restart)
  ws.onclose = function() {
    isConnected = false;
    statusDot.className = ""; // turns the dot red
    statusText.textContent = "Reconnecting...";
    sendButton.disabled = true;

    //wait 2 seconds then reconnecting again
    setTimeout(function() {
      connect();
    }, 2000);
  };

  // onerror runs if the WebSocket hits an error
  ws.onerror = function() {
    // Closing it will trigger onclose above, which updates the UI
    ws.close();
  };
}

// --- Load history ---

// loadHistory() fetches previously saved messages from the server
// and displays them when the page loads.
async function loadHistory() {

  // Build the HTTP URL for the history endpoint
  // We replace "ws://" with "http://" because this is a normal HTTP request
  var httpUrl = WORKER_URL.replace("ws://", "http://");

  try {
    // fetch() makes a normal HTTP GET request
    var response = await fetch(httpUrl + "/history/" + sessionId);

    // Parse the JSON response body into an object
    var data = await response.json();

    // If there are saved messages, display them
    if (data.messages && data.messages.length > 0) {
      emptyState.style.display = "none"; // hide the "ask something" placeholder

      // Loop through each message and add it to the chat
      for (var i = 0; i < data.messages.length; i++) {
        var message = data.messages[i];
        addMessageToChat(message.role, message.content);
      }

      scrollToBottom();
    }
  } catch (err) {
    // If loading history fails, it's okay — just start fresh
    console.log("Could not load history:", err);
  }
}

// --- Send a message ---

// send() is called when the user clicks Send or presses Enter.
function send() {

  // Get what the user typed and remove leading/trailing whitespace
  var text = inputBox.value.trim();

  // Don't do anything if the input is empty or we're not connected
  if (text === "") {
    return;
  }
  if (!isConnected) {
    return;
  }

  // Hide the empty state placeholder
  emptyState.style.display = "none";

  // Add the user's message to the chat immediately
  addMessageToChat("user", text);

  // Show the typing indicator (animated dots) while waiting for the AI
  showTypingIndicator();

  scrollToBottom();

  // Send the message to the server over WebSocket as a JSON string
  ws.send(JSON.stringify({ role: "user", content: text }));

  // Clear the input box
  inputBox.value = "";

  // Disable the input and button while waiting for the AI to reply
  sendButton.disabled = true;
  inputBox.disabled = true;
}

// --- Clear chat ---

// clearHistory() deletes all messages on the server and clears the UI.
async function clearHistory() {

  var httpUrl = WORKER_URL.replace("ws://", "http://");

  try {
    // POST to the /clear endpoint
    await fetch(httpUrl + "/clear/" + sessionId, { method: "POST" });
  } catch (err) {
    console.log("Could not clear history:", err);
  }

  // Clear all the message bubbles from the screen
  messagesDiv.innerHTML = "";

  // Re-add the empty state placeholder and show it
  messagesDiv.appendChild(emptyState);
  emptyState.style.display = "flex";
}

// --- UI helper functions ---

// addMessageToChat() creates a new message bubble and adds it to the chat.
// "role" is either "user" or "assistant"
// "text" is the message content
function addMessageToChat(role, text) {

  // Create a new <div> element
  var bubble = document.createElement("div");

  // Give it a CSS class so it gets styled correctly.
  // "msg user" styles it as a blue bubble on the right.
  // "msg assistant" styles it as a grey bubble on the left.
  bubble.className = "msg " + role;

  // Set the text inside the bubble
  bubble.textContent = text;

  // Add the bubble to the messages container
  messagesDiv.appendChild(bubble);

  return bubble; // return it so we can update it later (for streaming)
}

// showTypingIndicator() adds an animated "..." to show the AI is thinking.
function showTypingIndicator() {
  var indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typing"; // we give it an id so we can find and remove it later
  indicator.innerHTML = "<span></span><span></span><span></span>";
  messagesDiv.appendChild(indicator);
  scrollToBottom();
}

// removeTypingIndicator() removes the "..." animation.
function removeTypingIndicator() {
  var indicator = document.getElementById("typing");
  if (indicator) {
    indicator.remove();
  }
}

// scrollToBottom() scrolls the messages container to the bottom.
function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// --- Button and keyboard event listeners ---

// When the user clicks the Send button, call send()
sendButton.addEventListener("click", function() {
  send();
});

// When the user clicks the Clear button, call clearHistory()
clearButton.addEventListener("click", function() {
  clearHistory();
});

// When the user presses a key while typing in the input box:
inputBox.addEventListener("keydown", function(event) {
  // If they pressed Enter (without holding Shift), send the message
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // stops Enter from adding a new line
    send();
  }
});

// --- Start the app ---

// Open the WebSocket connection when the page loads
connect();