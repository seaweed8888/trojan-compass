import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <p className="eyebrow">USC indoor navigation</p>
      <h1>Find the room. Make the connection.</h1>
      <p>A starting point for helping first years and transfer students find classrooms, club meetings, and campus events.</p>
      <p className="status">Project scaffold — building models and navigation features are awaiting implementation.</p>
      <div className="links">
        <Link href="/map">Open the map workspace →</Link>
        <Link href="/events">Open the events workspace →</Link>
      </div>
    </>
  );
}
