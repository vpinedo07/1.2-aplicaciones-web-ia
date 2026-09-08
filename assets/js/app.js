const API_URL = "https://1-2-aplicaciones-web-ia-nine.vercel.app/api/chat";

const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");

/**
 * Lleva el scroll al mensaje más reciente sin desplazar la página completa.
 */
function scrollConversationToBottom() {
  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: "smooth",
  });
}

/**
 * Agrega un mensaje a la conversación.
 */
function addMessage(text, type) {

    const container = document.createElement("div");
    container.classList.add("message", type);

    const label = document.createElement("div");
    label.classList.add("message-label");

    label.textContent =
        type === "user"
            ? "Tú"
            : type === "loading"
            ? "IA"
            : "IA";

    const content = document.createElement("div");
    content.classList.add("message-content");

    // Las respuestas de la IA pueden contener Markdown
    if (type === "assistant") {

        const html = marked.parse(text);

        content.innerHTML =
            DOMPurify.sanitize(html);

    } else {

        // Los mensajes del usuario se muestran como texto
        content.textContent = text;
    }

    container.appendChild(label);
    container.appendChild(content);

    messages.appendChild(container);

    messages.scrollTop =
        messages.scrollHeight;

    return container;
}

/**
 * Muestra un indicador visual mientras llega la respuesta.
 */
function addLoadingMessage() {
  const container = document.createElement("div");
  container.classList.add("message", "assistant", "loading");

  const avatar = document.createElement("div");
  avatar.classList.add("message-avatar");
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "IA";

  const body = document.createElement("div");
  body.classList.add("message-body");

  const label = document.createElement("div");
  label.classList.add("message-label");
  label.textContent = "Asistente IA";

  const content = document.createElement("div");
  content.classList.add("message-content");
  content.setAttribute("aria-label", "La IA está pensando");

  const dots = document.createElement("span");
  dots.classList.add("typing-dots");
  dots.innerHTML = "<span></span><span></span><span></span>";

  content.appendChild(dots);
  body.appendChild(label);
  body.appendChild(content);
  container.appendChild(avatar);
  container.appendChild(body);
  messages.appendChild(container);

  requestAnimationFrame(scrollConversationToBottom);

  return container;
}

/**
 * Activa o desactiva los controles durante la petición.
 */
function setSendingState(isSending) {
  input.disabled = isSending;
  sendButton.disabled = isSending;
  sendButton.setAttribute("aria-busy", String(isSending));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message) {
    input.focus();
    return;
  }

  addMessage(message, "user");

  input.value = "";
  setSendingState(true);

  const loading = addLoadingMessage();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("El servidor devolvió una respuesta no válida.");
    }

    loading.remove();

    if (!response.ok) {
      throw new Error(data.error || "Error del servidor");
    }

    addMessage(data.reply || "La IA no devolvió contenido.", "assistant");
  } catch (error) {
    loading.remove();
    addMessage(`Error: ${error.message}`, "assistant");
  } finally {
    setSendingState(false);
    input.focus();
    scrollConversationToBottom();
  }
});

// Asegura que la conversación quede visible al cambiar el tamaño de pantalla.
window.addEventListener("resize", scrollConversationToBottom);
