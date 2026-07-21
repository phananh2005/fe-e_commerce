import { API_BASE_URL } from "./api";

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  publicId: string;
}

export async function getCloudinarySignature(
  token: string,
  folder: "brand" | "category" | "product"
): Promise<CloudinarySignatureResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/cloudinary/signature?folder=${folder}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 1000) return null;
    return data.result;
  } catch (error) {
    console.error("Failed to fetch cloudinary signature:", error);
    return null;
  }
}

export async function uploadImageToCloudinary(
  file: File,
  token: string,
  folder: "brand" | "category" | "product"
): Promise<string> {
  const signatureData = await getCloudinarySignature(token, folder);
  if (!signatureData) {
    throw new Error("Không thể kết nối đến server để lấy upload signature");
  }

  const { signature, timestamp, cloudName, apiKey, publicId } = signatureData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("public_id", publicId);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await uploadRes.json();

  if (!uploadRes.ok) {
    console.error("Cloudinary error response:", data);
    throw new Error(data.error?.message || "Upload ảnh thất bại");
  }

  return data.secure_url;
}
