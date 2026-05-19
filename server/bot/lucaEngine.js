const intents = require("./intents.json");
const { getSession, resetSession, pushHistory } = require("./sessionStore");

const HARD_FAIL_LIMIT = 3;

function normalize(text) {
  return (text || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function includesKeyword(text, list) {
  return list.some((kw) => text.includes(kw));
}

function pickSoftFallback(session) {
  const options = intents.softFallbacks.filter((m) => m !== session.lastBot);
  return options[Math.floor(Math.random() * options.length)] || intents.softFallbacks[0];
}

function detectCategory(text) {
  if (includesKeyword(text, intents.keywords.pizza)) return "pizza";
  if (includesKeyword(text, intents.keywords.pasta)) return "pasta";
  if (includesKeyword(text, intents.keywords.drinks)) return "drink";
  if (includesKeyword(text, intents.keywords.dessert)) return "dessert";
  if (includesKeyword(text, intents.keywords.menu)) return "menu";
  return null;
}

function extractQuantity(text) {
  const match = text.match(/\b(\d{1,2})\b/);
  if (match) return parseInt(match[1], 10);
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  for (const [w, n] of Object.entries(words)) {
    if (text.includes(w)) return n;
  }
  return null;
}

function menuBlock() {
  const m = intents.menu;
  return (
    "Here is our menu tonight:\n\n" +
    `🍕 **Pizzas:** ${m.pizzas.join(", ")}\n` +
    `🍝 **Pasta:** ${m.pastas.join(", ")}\n` +
    `🍷 **Drinks:** ${m.drinks.join(", ")}\n` +
    `🍮 **Desserts:** ${m.desserts.join(", ")}\n\n` +
    "What would you like to start with?"
  );
}

function orderSummary(order) {
  const lines = [];
  if (order.items.length) {
    lines.push("**Main dishes:**");
    order.items.forEach((i) => lines.push(`• ${i.qty}× ${i.name}${i.note ? ` (${i.note})` : ""}`));
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
    return intents.hardFallback;
  }
  return pickSoftFallback(session);
}

function processMessage(sessionId, userText) {
  const session = getSession(sessionId);
  session._id = sessionId;
  const text = normalize(userText);

  if (!text) {
    return setReply(session, "I'm listening — what would you like tonight? 🍷");
  }

  pushHistory(session, "user", userText);

  if (includesKeyword(text, intents.keywords.bill) && session.stage !== "confirm") {
    const reply = setReply(
      session,
      "Your bill will be ready at the end — let me finish your order first, then I'll get the total for you. 💶\n\nShall we continue?"
    );
    pushHistory(session, "bot", reply);
    return reply;
  }

  let reply = "";

  switch (session.stage) {
    case "welcome": {
      if (includesKeyword(text, intents.keywords.menu) || detectCategory(text)) {
        if (detectCategory(text) === "menu" || includesKeyword(text, intents.keywords.menu)) {
          session.stage = "pick_item";
          reply = setReply(session, menuBlock());
        } else {
          session.pending = { category: detectCategory(text) };
          session.stage = "item_name";
          reply = setReply(
            session,
            `Perfetto! A fine choice. 🍝\n\nWhich **${session.pending.category}** would you like? You can pick from our menu or tell me the name.`
          );
        }
      } else if (includesKeyword(text, intents.keywords.greeting) || text.length < 20) {
        session.stage = "pick_item";
        reply = setReply(
          session,
          `Buonasera! I am **Luca**, your waiter at *${intents.restaurant}*. ✨\n\n` +
            `Tonight I will guide you through your order, step by step.\n\n` +
            `Would you like to see the **menu**, or tell me what you are craving — pizza, pasta, drinks, or dessert?`
        );
      } else {
        session.pending = { category: detectCategory(text) || "dish" };
        session.stage = "item_name";
        reply = setReply(session, `Wonderful! Tell me which dish you had in mind, and how many portions. 🍕`);
      }
      break;
    }

    case "pick_item": {
      if (
        includesKeyword(text, intents.keywords.greeting) &&
        !detectCategory(text)
      ) {
        reply = setReply(
          session,
          `Buonasera! Tell me what you would like — **menu**, **pizza**, **pasta**, **drinks**, or **dessert**? 🍷`
        );
      } else if (includesKeyword(text, intents.keywords.menu)) {
        reply = setReply(session, menuBlock());
      } else {
        const cat = detectCategory(text);
        if (cat === "drink") {
          session.stage = "drinks";
          reply = setReply(
            session,
            `Our drinks: **${intents.menu.drinks.join(", ")}**.\n\nWhich would you like?`
          );
        } else if (cat === "dessert") {
          session.stage = "desserts";
          reply = setReply(
            session,
            `Our desserts: **${intents.menu.desserts.join(", ")}**.\n\nWhich sweet treat shall I add?`
          );
        } else if (cat) {
          session.pending = { category: cat };
          session.stage = "item_name";
          const list =
            cat === "pizza" ? intents.menu.pizzas : cat === "pasta" ? intents.menu.pastas : [];
          reply = setReply(
            session,
            `Excellent! Choose your **${cat}**:\n${list.map((x) => `• ${x}`).join("\n")}\n\nOr type the name you prefer.`
          );
        } else {
          session.pending = { name: capitalize(userText) };
          session.stage = "item_qty";
          reply = setReply(
            session,
            `**${capitalize(userText)}** — excellent! How many portions would you like? (e.g. 2)`
          );
        }
      }
      break;
    }

    case "item_name": {
      session.pending = session.pending || {};
      session.pending.name = capitalize(userText);
      session.stage = "item_qty";
      reply = setReply(
        session,
        `**${session.pending.name}** — bellissimo! How many would you like? 🔢`
      );
      break;
    }

    case "item_qty": {
      const qty = extractQuantity(text) || (includesKeyword(text, intents.keywords.yes) ? 1 : null);
      if (!qty) {
        reply = setReply(session, failUnderstand(session));
        break;
      }
      const name = session.pending?.name || session.pending?.raw || "Chef's special";
      session.order.items.push({ name, qty, note: session.pending?.category || "" });
      session.pending = null;
      session.stage = "more_items";
      reply = setReply(
        session,
        `Added **${qty}× ${name}** to your order. ✅\n\nWould you like anything else — pizza, pasta, drinks, or dessert? (**yes** / **no**)`
      );
      break;
    }

    case "more_items": {
      if (includesKeyword(text, intents.keywords.yes)) {
        session.stage = "pick_item";
        reply = setReply(session, `What else can I bring you? 🍝\n\n${menuBlock().split("\n\n")[1]}`);
      } else if (includesKeyword(text, intents.keywords.no)) {
        session.stage = "drinks";
        reply = setReply(
          session,
          `Perfetto! Now for drinks — we have **${intents.menu.drinks.join(", ")}**.\n\nWhat would you like? (or say **no** to skip)`
        );
      } else {
        const cat = detectCategory(text);
        if (cat) {
          session.stage = "item_name";
          session.pending = { category: cat };
          const list =
            cat === "pizza" ? intents.menu.pizzas : cat === "pasta" ? intents.menu.pastas : [];
          reply = setReply(
            session,
            `Of course! Pick your **${cat}**:\n${list.map((x) => `• ${x}`).join("\n")}`
          );
        } else {
          reply = setReply(session, failUnderstand(session));
        }
      }
      break;
    }

    case "drinks": {
      if (includesKeyword(text, intents.keywords.no)) {
        session.stage = "desserts";
        reply = setReply(
          session,
          `No problem. And dessert? **${intents.menu.desserts.join(", ")}** — or say **no** to skip. 🍮`
        );
      } else {
        session.order.drinks.push(capitalize(userText));
        session.stage = "desserts";
        reply = setReply(
          session,
          `**${capitalize(userText)}** added. 🍷\n\nWould you like dessert? **${intents.menu.desserts.join(", ")}** (or **no**)`
        );
      }
      break;
    }

    case "desserts": {
      if (includesKeyword(text, intents.keywords.no)) {
        session.stage = "service";
        reply = setReply(
          session,
          `All good. Will this be **dine-in**, **takeaway**, or **delivery**? 🏠`
        );
      } else {
        session.order.desserts.push(capitalize(userText));
        session.stage = "service";
        reply = setReply(
          session,
          `**${capitalize(userText)}** — delicious choice! 🍮\n\nWill you **dine in**, **takeaway**, or **delivery**?`
        );
      }
      break;
    }

    case "service": {
      if (includesKeyword(text, intents.keywords.delivery)) {
        session.order.service = "Delivery";
        session.stage = "name";
        reply = setReply(session, `Delivery it is. May I have your **name**, per favore?`);
      } else if (includesKeyword(text, intents.keywords.takeaway)) {
        session.order.service = "Takeaway";
        session.stage = "name";
        reply = setReply(session, `Takeaway — perfetto! What **name** shall I put on the order?`);
      } else if (includesKeyword(text, intents.keywords.dineIn)) {
        session.order.service = "Dine-in";
        session.stage = "name";
        reply = setReply(session, `A table for tonight — wonderful! What **name** for the reservation?`);
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
        `Grazie, **${session.order.name}**! A **phone number** in case we need to reach you? 📱`
      );
      break;
    }

    case "phone": {
      session.order.phone = userText.trim();
      if (session.order.service === "Delivery") {
        session.stage = "address";
        reply = setReply(session, `And your **delivery address**, please? 🏠`);
      } else {
        session.stage = "confirm";
        reply = setReply(
          session,
          `Please confirm your order:\n\n${orderSummary(session.order)}\n\nIs everything correct? (**yes** / **no**)`
        );
      }
      break;
    }

    case "address": {
      session.order.address = userText.trim();
      session.stage = "confirm";
      reply = setReply(
        session,
        `Please confirm your order:\n\n${orderSummary(session.order)}\n\nIs everything correct? (**yes** / **no**)`
      );
      break;
    }

    case "confirm": {
      if (includesKeyword(text, intents.keywords.yes)) {
        session.stage = "done";
        reply = setReply(
          session,
          `**Grazie mille, ${session.order.name}!** 🎉\n\nYour order is confirmed. Luca will send it to the kitchen straight away.\n\n` +
            `${orderSummary(session.order)}\n\n` +
            `Estimated time: **25–35 minutes**. Arrivederci and buon appetito! 🍕`
        );
        resetSession(sessionId);
      } else if (includesKeyword(text, intents.keywords.no)) {
        resetSession(sessionId);
        reply = setReply(
          session,
          intents.hardFallback
        );
      } else {
        reply = setReply(session, failUnderstand(session));
      }
      break;
    }

    case "done":
    default: {
      resetSession(sessionId);
      session.stage = "pick_item";
      reply = setReply(
        session,
        `Buonasera again! Ready for a new order? 🍝\n\n${menuBlock()}`
      );
    }
  }

  pushHistory(session, "bot", reply);
  return reply;
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resetConversation(sessionId) {
  resetSession(sessionId);
  const reply =
    `Conversation reset. Buonasera! I am **Luca** at *${intents.restaurant}*. 🍕\n\n` +
    `Tell me — would you like the **menu**, or shall we start with a pizza or pasta?`;
  const session = getSession(sessionId);
  pushHistory(session, "bot", reply);
  session.stage = "welcome";
  session.lastBot = reply;
  return reply;
}

module.exports = { processMessage, resetConversation };
