const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const Avatar = ({ name, src, size = "h-10 w-10", className = "" }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "User avatar"}
        className={`${size} rounded-2xl object-cover shadow-float ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${size} items-center justify-center rounded-2xl bg-accent/12 text-sm font-semibold text-accent ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
