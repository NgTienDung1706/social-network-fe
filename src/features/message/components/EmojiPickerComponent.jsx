import EmojiPicker from "emoji-picker-react";

const EmojiPickerComponent = ({ onSelect }) => {
  return (
    <div className="absolute bottom-16 right-4 z-50">
      <EmojiPicker
        onEmojiClick={(emojiObject) => onSelect(emojiObject.emoji)}
        width={400}
        height={500}
      />
    </div>
  );
};

export default EmojiPickerComponent;
