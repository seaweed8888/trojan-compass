import { BuildingMap } from "@/features/map/components/BuildingMap";
import { RoomSearch } from "@/features/search/components/RoomSearch";
import { RoutePlanner } from "@/features/routing/components/RoutePlanner";
import { ChatPanel } from "@/features/chat/components/ChatPanel";

export default function MapPage() {
  return (
    <>
      <h1>Building map</h1>
      <p>Feature placeholders for the team to connect to building data.</p>
      <div className="workspace">
        <BuildingMap />
        <div className="sidebar"><RoomSearch /><RoutePlanner /><ChatPanel /></div>
      </div>
    </>
  );
}
