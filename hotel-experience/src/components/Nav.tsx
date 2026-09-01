"use client";

interface Props {
  visible: boolean;
}

export function Nav({ visible }: Props) {
  return (
    <header className={`nav ${visible ? "" : "nav--hidden"}`}>
      <div className="nav__logo">AURELIA</div>
      <div className="nav__right">
        <button className="nav__link" type="button">
          Menu
        </button>
        <button className="nav__book" type="button">
          Book Stay
        </button>
      </div>
    </header>
  );
}
