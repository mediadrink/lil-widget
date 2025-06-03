(function () {
  const params = new URLSearchParams(window.location.search);
  const widgetId = params.get("uid") || "demo123";

  const apiBase = "https://lil-widget-n3s7.vercel.app"; // change to your live domain when deployed

  const style = document.createElement("style");
  style.innerHTML = `
    #lil-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      max-width: 360px;
      width: 100%;
      background: white;
      border: 1px solid #ccc;
      border-radius: 1rem;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      font-family: sans-serif;
      z-index: 9999;
      padding: 1rem;
    }
    #lil-chat {
      max-height: 200px;
      overflow-y: auto;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      border: 1px solid #eee;
      padding: 0.5rem;
      border-radius: 0.5rem;
    }
    #lil-input {
      width: 100%;
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid #ccc;
      margin-bottom: 0.5rem;
    }
    #lil-send {
      background: black;
      color: white;
      padding: 0.5rem;
      width: 100%;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "lil-widget";
  root.innerHTML = `
    <h4>💬 LIL Widget</h4>
    <div id="lil-chat"></div>
    <input id="lil-input" placeholder="Type a message..." />
    <button id="lil-send">Send</button>
  `;
  document.body.appendChild(root);

  const chat = document.getElementById("lil-chat");
  const input = document.getElementById("lil-input");
  const send = document.getElementById("lil-send");

  const addMessage = (role, content) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${role}:</strong> ${content}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  };

  send.onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    addMessage("You", msg);
    input.value = "...";
    input.disabled = true;
    send.disabled = true;

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, widgetId })
      });
      const data = await res.json();
      addMessage("Bot", data.reply || "⚠️ No reply.");
    } catch (e) {
      addMessage("Bot", "⚠️ Error connecting to backend.");
    }

    input.value = "";
    input.disabled = false;
    send.disabled = false;
  };
})();
