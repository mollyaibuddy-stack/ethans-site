import Navbar from "@/components/Navbar";
import CyberFoodBeads from "@/components/CyberFoodBeads";
import HoopSnakeGame from "@/components/HoopSnakeGame";

export default function Projects() {
  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Projects</h1>
        <p>Things I've made and built.</p>
        <HoopSnakeGame />
        <CyberFoodBeads />
      </main>
    </>
  );
}
