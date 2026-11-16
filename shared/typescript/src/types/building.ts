/** Model-local coordinates in meters: X/Z horizontal, Y vertical. */
export interface Position3D { x: number; y: number; z: number; }

export interface Floor { id: string; label: string; elevation: number; }

export interface Building {
  id: string;
  name: string;
  code: string;
  modelUrl: string;
  floors: Floor[];
}
