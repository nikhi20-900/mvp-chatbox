import { useState } from "react";
import useChatStore from "../store/chatStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const { selectedUser, sendMessage, isSendingMessage } = useChatStore();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!text.trim() || !selectedUser) {
      return;
    }

    try {
      await sendMessage(selectedUser._id, text);
      setText("");
    } catch (error) {
      console.error(error.message);
    }
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-800 bg-slate-950/60 px-4 py-4 md:px-6"
    >
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={isSendingMessage || !text.trim()}
          className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
