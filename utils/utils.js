export const getOptimizedUrls = (imageUrl) => {
  return {
    thumbnail: imageUrl.replace(
      "/upload/",
      "/upload/w_300,h_300,c_fill,q_auto,f_auto/"
    ),
    medium: imageUrl.replace(
      "/upload/",
      "/upload/w_800,h_800,c_limit,q_auto,f_auto/"
    ),
    large: imageUrl.replace(
      "/upload/",
      "/upload/w_1920,h_1920,c_limit,q_auto,f_auto/"
    ),
  };
};


export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

