export type MapPoint = {
  latitude: number;
  longitude: number;
  title?: string;
};

// Presentation-only inputs. Places, route quotes and future driver feeds belong
// in screens/services; the map never receives server credentials or books rides.
export type RealMapProps = {
  current?: MapPoint;
  pickup?: MapPoint;
  drop?: MapPoint;
  route?: MapPoint[];
  selected?: MapPoint;
  onSelect?: (point: MapPoint) => void;
  height?: number;
};
