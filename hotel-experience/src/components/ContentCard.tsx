"use client";

import { ContentCard as ContentCardData } from "@/data/journey";

interface Props {
  card: ContentCardData;
  visibility: number;
  side: "left" | "right";
}

export function ContentCard({ card, visibility, side }: Props) {
  if (visibility <= 0.01) return null;
  const shift = (1 - visibility) * 40;
  return (
    <div
      className={`content-card content-card--${side}`}
      style={{
        opacity: visibility,
        transform: `translate(${side === "left" ? -shift : shift}px, 0)`,
      }}
    >
      <span className="content-card__eyebrow">{card.eyebrow}</span>
      <h3 className="content-card__title">{card.title}</h3>
      <p className="content-card__body">{card.body}</p>
    </div>
  );
}
