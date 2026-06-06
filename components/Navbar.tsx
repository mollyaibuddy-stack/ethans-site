"use client";
import { useState } from "react";
import Link from "next/link";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/hobbies", label: "Hobbies" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/basketball", label: "Basketball" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">Ethan</Link>
      <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
        <span className={"hamburger" + (open ? " open" : "")} />
      </button>
      <div className={"navbar-links" + (open ? " open" : "")}>
        {publicLinks.map(link => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href="/private" className="private-link" onClick={() => setOpen(false)}>
          Private
        </Link>
      </div>
    </nav>
  );
}
