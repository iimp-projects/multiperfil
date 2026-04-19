export const getBucketName = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.includes("qa")
    ) {
      return "multiperfil-qa-files";
    }
  }
  return "multiperfil-prod-files";
};

export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  
  const bucket = getBucketName();
  const region = "sa-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
};
