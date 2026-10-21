// Decodes a Google encoded polyline (the format the Routes API returns) into map coordinates.
export function decodePolyline(encoded: string) {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    lat += next();
    lng += next();
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
