import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero">
          <h1>Hey, I'm Ethan</h1>
          <p className="lead">
            Welcome to my corner of the internet. I play basketball for the
            Bulleen Boomers, love building things, and I'm always learning
            something new.
          </p>
          <div className="hero-links">
            <Link href="/basketball">See my games</Link>
            <Link href="/projects">My projects</Link>
          </div>
        </section>

        <section className="section">
          <h2>Quick facts</h2>
          <ul className="facts">
            <li>U13 Boys basketball — Bulleen Boomers</li>
            <li>I like coding, gaming, and art</li>
            <li>Building this website with my dad</li>
          </ul>
        </section>
      </main>
    </>
  );
}
