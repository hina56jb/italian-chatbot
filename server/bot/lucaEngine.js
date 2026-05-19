const intents = require("./intents.json");
const { getSession, resetSession, pushHistory } = require("./sessionStore");

const HARD_FAIL_LIMIT = 4;
const CHIPS = intents.chipPhrases;

function normalize(text) {
  return (text || "").toLowerCase().trim().replace(/[?!.]+$/g, "").replace(/\s+/g, " ");
}

function includesKeyword(text, list) {
  return list.some((kw) => text.includes(kw));
}

function isInquiry(text) {
  return /(what|which|do you have|show|list|tell me|can i see|any|available)/.test(text);
}

function isGreeting(text) {
  const t = text.replace(/[^a-z\s]/g, "");
  return includesKeyword(t, intents.keywords.greeting) && t.length < 25;
}

function pickSoftFallback(session) {
  const options = intents.softFallbacks.filter((m) => m !== session.lastBot);
  return options[Math.floor(Math.random() * options.length)] || intents.softFallbacks[0];
}

function menuBlock() {
  const m = intents.menu;
  return (
    "Here is our menu tonight:\n\n" +
    `🍕 **Pizzas:** ${m.pizzas.join(", ")}\n` +
    `🍝 **Pasta:** ${m.pastas.join(", ")}\n` +
    `🍷 **Drinks:** ${m.drinks.join(", ")}\n` +
    `🍮 **Desserts:** ${m.desserts.join(", ")}\n\n` +
    "Tell me what you would like — for example **Margherita** or **Spaghetti Carbonara**."
  );
}

function listPizzas() {
  return (
    `Our pizzas tonight:\n${intents.menu.pizzas.map((p) => `• **${p}**`).join("\n")}\n\n` +
    "Which pizza shall I add? You can type the name (e.g. **Margherita**)."
  );
}

function listPastas() {
  return (
    `Our pasta dishes:\n${intents.menu.pastas.map((p) => `• **${p}**`).join("\n")}\n\n` +
    "Which pasta would you like?"
  );
}

function listDrinks() {
  return (
    `Our drinks:\n${intents.menu.drinks.map((d) => `• **${d}**`).join("\n")}\n\n` +
    "Which drink would you like? (Or say **no** when we reach the drinks step.)"
  );
}

function listDesserts() {
  return (
    `Our desserts:\n${intents.menu.desserts.map((d) => `• **${d}**`).join("\n")}\n\n` +
    "Which dessert tempts you?"
  );
}

function orderSummary(order) {
  const lines = [];
  if (order.items.length) {
    lines.push("**Main dishes:**");
    order.items.forEach((i) =>
      lines.push(`• ${i.qty}× ${i.name}${i.note ? ` (${i.note})` : ""}`)
    );
  }
  if (order.drinks.length) lines.push(`**Drinks:** ${order.drinks.join(", ")}`);
  if (order.desserts.length) lines.push(`**Desserts:** ${order.desserts.join(", ")}`);
  lines.push(`**Service:** ${order.service || "—"}`);
  if (order.name) lines.push(`**Name:** ${order.name}`);
  if (order.phone) lines.push(`**Phone:** ${order.phone}`);
  if (order.address) lines.push(`**Address:** ${order.address}`);
  return lines.join("\n");
}

function setReply(session, message) {
  session.lastBot = message;
  session.softFails = 0;
  return message;
}

function failUnderstand(session) {
  session.softFails += 1;
  if (session.softFails >= HARD_FAIL_LIMIT) {
    resetSession(session._id);
    const s = getSession(session._id);
    s.stage = "pick_item";
    return intents.hardFallback;
  }
  return pickSoftFallback(session);
}

function capitalize(s) {
  if (!s) return "";
  return s.trim().charAt(0).toUpperCase() + s.trim().slice(1);
}

function findMenuItem(text) {
  const t = normalize(text);
  const all = [
    ...intents.menu.pizzas.map((n) => ({ name: n, type: "pizza" })),
    ...intents.menu.pastas.map((n) => ({ name: n, type: "pasta" })),
    ...intents.menu.drinks.map((n) => ({ name: n, type: "drink" })),
    ...intents.menu.desserts.map((n) => ({ name: n, type: "dessert" })),
  ];
  return all.find((item) => t.includes(item.name.toLowerCase()));
}

/** Match UI chips + natural questions (works in any stage). */
function matchGlobalIntent(text) {
  if (!text) return null;

  if (
    text === normalize(CHIPS.menu) ||
    includesKeyword(text, intents.keywords.menu) ||
    /show\s+(me\s+)?(the\s+)?menu/.test(text)
  ) {
    return "MENU";
  }

  if (
    text === normalize(CHIPS.bill) ||
    includesKeyword(text, intents.keywords.bill)
  ) {
    return "BILL";
  }

  if (
    text === normalize(CHIPS.drinks) ||
    (text.includes("drink") && isInquiry(text))
  ) {
    return "DRINKS_LIST";
  }

  if (
    text === normalize(CHIPS.pasta) ||
    (text.includes("pasta") && isInquiry(text))
  ) {
    return "PASTA_LIST";
  }

  if (
    text === normalize(CHIPS.dessert) ||
    (text.includes("dessert") && isInquiry(text))
  ) {
    return "DESSERT_LIST";
  }

  if (
    text === normalize(CHIPS.pizza) ||
    text.includes("order pizza") ||
    text.includes("want pizza") ||
    text.includes("like pizza") ||
    (text.includes("pizza") && !isInquiry(text))
  ) {
    return "PIZZA_START";
  }

  const item = findMenuItem(text);
  if (item) return { type: "ADD_ITEM", item };

  return null;
}

function handleGlobalIntent(session, intent) {
  if (typeof intent === "object" && intent.type === "ADD_ITEM") {
    session.pending = { name: intent.item.name, category: intent.item.type };
    session.stage = "item_qty";
    return setReply(
      session,
      `**${intent.item.name}** — excellent choice! How many portions? (e.g. **1** or **2**)`
    );
  }

  switch (intent) {
    case "MENU":
      session.stage = "pick_item";
      session.pending = null;
      return setReply(session, menuBlock());

    case "BILL":
      return setReply(
        session,
        "Your bill comes at the end — let me complete your order first. 💶\n\n" +
          "Say **menu**, add a **pizza** or **pasta**, or tell me what you need next."
      );

    case "DRINKS_LIST":
      session.stage = "pick_item";
      session.pending = { category: "drink", mode: "browse" };
      return setReply(session, listDrinks());

    case "PASTA_LIST":
      session.stage = "item_name";
      session.pending = { category: "pasta" };
      return setReply(session, listPastas());

    case "PIZZA_START":
    case "PIZZA_LIST":
      session.stage = "item_name";
      session.pending = { category: "pizza" };
      return setReply(session, listPizzas());

    case "DESSERT_LIST":
      session.stage = "pick_item";
      session.pending = { category: "dessert", mode: "browse" };
      return setReply(session, listDesserts());

    default:
      return null;
  }
}

function extractQuantity(text) {
  const match = text.match(/\b(\d{1,2})\b/);
  if (match) return parseInt(match[1], 10);
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  for (const [w, n] of Object.entries(words)) {
    if (new RegExp(`\\b${w}\\b`).test(text)) return n;
  }
  return null;
}

function introMessage() {
  return (
    `Buonasera! I am **Luca**, your waiter at *${intents.restaurant}*. ✨\n\n` +
    `I will guide you through your order **one step at a time**.\n\n` +
    `Tap a button below or say: **menu**, **pizza**, **pasta**, **drinks**, or **dessert**.`
  );
}

function processMessage(sessionId, userText) {
  const session = getSession(sessionId);
  session._id = sessionId;
  const text = normalize(userText);

  if (!text) {
    return setReply(session, "I'm here — what would you like tonight? 🍷");
  }

  pushHistory(session, "user", userText);

  const globalIntent = matchGlobalIntent(text);
  if (globalIntent) {
    const globalReply = handleGlobalIntent(session, globalIntent);
    if (globalReply) {
      pushHistory(session, "bot", globalReply);
      return globalReply;
    }
  }

  if (isGreeting(text) && session.stage !== "confirm") {
    session.stage = "pick_item";
    const reply = setReply(session, introMessage());
    pushHistory(session, "bot", reply);
    return reply;
  }

  let reply = "";

  switch (session.stage) {
    case "welcome":
    case "pick_item": {
      if (session.pending?.mode === "browse" && session.pending.category === "drink") {
        const drink = findMenuItem(text);
        if (drink) {
          session.order.drinks.push(drink.name);
          session.pending = null;
          session.stage = "pick_item";
          reply = setReply(
            session,
            `**${drink.name}** noted for later. 🍷\n\nWould you like **pizza** or **pasta** to start? Or say **menu**.`
          );
          break;
        }
      }

      const item = findMenuItem(text);
      if (item && (item.type === "pizza" || item.type === "pasta")) {
        session.pending = { name: item.name, category: item.type };
        session.stage = "item_qty";
        reply = setReply(
          session,
          `**${item.name}** — perfetto! How many portions? (e.g. **2**)`
        );
      } else {
        reply = setReply(session, failUnderstand(session));
      }
      break;
    }

    case "item_name": {
      const item = findMenuItem(text);
      if (item) {
        session.pending = { name: item.name, category: item.type };
        session.stage = "item_qty";
        reply = setReply(
          session,
          `**${item.name}** — bellissimo! How many would you like? 🔢`
        );
      } else if (text.length >= 2 && !isInquiry(text)) {
        session.pending = { name: capitalize(userText), category: session.pending?.category || "dish" };
        session.stage = "item_qty";
        reply = setReply(
          session,
          `**${session.pending.name}** — noted! How many portions?`
        );
      } else {
        reply = setReply(session, failUnderstand(session));
      }
      break;
    }

    case "item_qty": {
      const qty = extractQuantity(text);
      if (!qty) {
        reply = setReply(session, failUnderstand(session));
        break;
      }
      const name = session.pending?.name || "Special";
      session.order.items.push({
        name,
        qty,
        note: session.pending?.category || "",
      });
      session.pending = null;
      session.stage = "more_items";
      reply = setReply(
        session,
        `Added **${qty}× ${name}** to your order. ✅\n\nAnything else? (**yes** / **no**)\n\nOr ask for **menu**, **drinks**, **dessert**.`
      );
      break;
    }

    case "more_items": {
      if (includesKeyword(text, intents.keywords.yes)) {
        session.stage = "pick_item";
        reply = setReply(
          session,
          `What else would you like? 🍝\n\nSay **pizza**, **pasta**, **drinks**, **dessert**, or **menu**.`
        );
      } else if (includesKeyword(text, intents.keywords.no)) {
        session.stage = "drinks";
        reply = setReply(
          session,
          `Perfetto! For drinks:\n${intents.menu.drinks.map((d) => `• **${d}**`).join("\n")}\n\nYour choice, or **no** to skip.`
        );
      } else {
        reply = setReply(session, failUnderstand(session));
      }
      break;
    }

    case "drinks": {
      if (includesKeyword(text, intents.keywords.no)) {
        session.stage = "desserts";
        reply = setReply(
          session,
          `No drinks — and dessert?\n${intents.menu.desserts.map((d) => `• **${d}**`).join("\n")}\n\nPick one or **no**.`
        );
      } else {
        const drink = findMenuItem(text);
        session.order.drinks.push(drink ? drink.name : capitalize(userText));
        session.stage = "desserts";
        reply = setReply(
          session,
          `Drink added. 🍷\n\nDessert? ${intents.menu.desserts.join(", ")} — or **no**.`
        );
      }
      break;
    }

    case "desserts": {
      if (includesKeyword(text, intents.keywords.no)) {
        session.stage = "service";
        reply = setReply(
          session,
          `Will this be **dine-in**, **takeaway**, or **delivery**? 🏠`
        );
      } else {
        const dessert = findMenuItem(text);
        session.order.desserts.push(dessert ? dessert.name : capitalize(userText));
        session.stage = "service";
        reply = setReply(
          session,
          `Dessert added! 🍮\n\n**Dine-in**, **takeaway**, or **delivery**?`
        );
      }
      break;
    }

    case "service": {
      if (includesKeyword(text, intents.keywords.delivery)) {
        session.order.service = "Delivery";
        session.stage = "name";
        reply = setReply(session, `Delivery — may I have your **name**?`);
      } else if (includesKeyword(text, intents.keywords.takeaway)) {
        session.order.service = "Takeaway";
        session.stage = "name";
        reply = setReply(session, `Takeaway — your **name**, please?`);
      } else if (includesKeyword(text, intents.keywords.dineIn)) {
        session.order.service = "Dine-in";
        session.stage = "name";
        reply = setReply(session, `Dine-in — **name** for the table?`);
      } else {
        reply = setReply(session, failUnderstand(session));
      }
      break;
    }

    case "name": {
      session.order.name = capitalize(userText);
      session.stage = "phone";
      reply = setReply(
        session,
        `Grazie, **${session.order.name}**! Your **phone number**? 📱`
      );
      break;
    }

    case "phone": {
      session.order.phone = userText.trim();
      if (session.order.service === "Delivery") {
        session.stage = "address";
        reply = setReply(session, `**Delivery address**, please? 🏠`);
      } else {
        session.stage = "confirm";
        reply = setReply(
          session,
          `Please confirm:\n\n${orderSummary(session.order)}\n\n**yes** or **no**?`
        );
      }
      break;
    }

    case "address": {
      session.order.address = userText.trim();
      session.stage = "confirm";
      reply = setReply(
        session,
        `Please confirm:\n\n${orderSummary(session.order)}\n\n**yes** or **no**?`
      );
      break;
    }

    case "confirm": {
      if (includesKeyword(text, intents.keywords.yes)) {
        const summary = orderSummary(session.order);
        const name = session.order.name || "friend";
        resetSession(sessionId);
        reply = setReply(
          session,
          `**Grazie mille, ${name}!** 🎉\n\nOrder confirmed:\n\n${summary}\n\n` +
            `Ready in **25–35 minutes**. Buon appetito!`
        );
      } else if (includesKeyword(text, intents.keywords.no)) {
        resetSession(sessionId);
        const s = getSession(sessionId);
        s.stage = "pick_item";
        reply = setReply(session, intents.hardFallback);
      } else {
        reply = setReply(session, failUnderstand(session));
      }
      break;
    }

    default:
      session.stage = "pick_item";
      reply = setReply(session, introMessage());
  }

  pushHistory(session, "bot", reply);
  return reply;
}

function resetConversation(sessionId) {
  resetSession(sessionId);
  const session = getSession(sessionId);
  session.stage = "pick_item";
  const reply = setReply(
    session,
    `Conversation reset. ${introMessage()}`
  );
  pushHistory(session, "bot", reply);
  return reply;
}

module.exports = { processMessage, resetConversation };
