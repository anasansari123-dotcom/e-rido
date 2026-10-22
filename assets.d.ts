declare module '*.mp4' {
  const src: number;
  export default src;
}

declare module '@react-native/assets-registry/registry' {
  export function getAssetByID(assetId: number): {
    httpServerLocation: string;
    name: string;
    type?: string;
  } | undefined;
}
