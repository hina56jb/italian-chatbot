const CHIPS = [
  { label: "📋 Menu", text: "Show me the menu" },
  { label: "🍕 Pizza", text: "I want to order pizza" },
  { label: "🍝 Pasta", text: "What pasta do you have?" },
  { label: "🍷 Drinks", text: "What drinks do you have?" },
  { label: "🍮 Dessert", text: "Do you have desserts?" },
  { label: "💶 Bill", text: "Can I get the bill please?" },
];

export default function QuickReplies({ onSelect, disabled }) {
  return (
    <div className="quick-replies">
      {CHIPS.map((chip) => (
        <button
          key={chip.text}
          type="button"
          className="chip"
          disabled={disabled}
          onClick={() => onSelect(chip.text)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
