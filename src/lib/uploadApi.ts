import { API_BASE_URL } from "./api";

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export async function getCloudinarySignature(
  token: string,
  folder = "products"
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
  folder = "products"
): Promise<string | null> {
  try {
    const signatureData = await getCloudinarySignature(token, folder);
    if (!signatureData) {
      throw new Error("Could not get upload signature");
    }

    const { signature, timestamp, cloudName, apiKey } = signatureData;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      throw new Error("Upload to Cloudinary failed");
    }

    const data = await uploadRes.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}
