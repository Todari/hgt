import { css } from "_panda/css";

function renderLine(line: string, index: number) {
  if (line.startsWith("# ")) {
    return (
      <h1
        key={index}
        className={css({
          color: "ink.950",
          fontSize: "2xl",
          fontWeight: "black",
          lineHeight: "1.18",
        })}
      >
        {line.slice(2)}
      </h1>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <h2
        key={index}
        className={css({
          marginTop: "3",
          color: "ink.950",
          fontSize: "lg",
          fontWeight: "black",
          lineHeight: "1.35",
        })}
      >
        {line.slice(3)}
      </h2>
    );
  }

  if (line.startsWith("- ") || /^\d+\.\s/.test(line)) {
    return (
      <p
        key={index}
        className={css({
          color: "ink.700",
          fontSize: "sm",
          lineHeight: "1.7",
          paddingLeft: "3",
        })}
      >
        {line}
      </p>
    );
  }

  if (!line.trim()) {
    return <div key={index} className={css({ height: "2" })} />;
  }

  return (
    <p
      key={index}
      className={css({
        color: "ink.700",
        fontSize: "sm",
        lineHeight: "1.75",
      })}
    >
      {line}
    </p>
  );
}

export function LegalDocument({ markdown }: { markdown: string }) {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "1",
        maxHeight: "360px",
        overflowY: "auto",
        paddingRight: "2",
      })}
    >
      {markdown.split("\n").map(renderLine)}
    </div>
  );
}
