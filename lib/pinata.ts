import axios, { AxiosError } from "axios";
import FormData from "form-data";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;

async function pinFileToIPFS(file: File | Buffer) {
  let fileName = file.name;

  try {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const formData = new FormData();

    // Handle both File and Buffer types
    if (file instanceof File) {
      formData.append("file", file, file.name);
    }

    console.log(`Uploading file to Pinata: ${fileName}`);
    const res = await axios.post(url, formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        // Remove formData.getHeaders() as it's not available in browser
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(
      `Successfully uploaded ${fileName} to IPFS:`,
      res.data.IpfsHash
    );
    return res.data.IpfsHash;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(`Error uploading ${fileName} to Pinata:`, axiosError.message);
    throw new Error(
      `Failed to upload ${fileName} to IPFS: ${axiosError.message}`
    );
  }
}

// Helper to upload JSON metadata to Pinata
export async function pinJSONToIPFS(
  json: Record<string, any>,
  fileType: string = "nft"
) {
  try {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    console.log("Uploading metadata to Pinata:", json);

    const params = {
      pinataMetadata: {
        name: `${json?.title}-${fileType}.json`,
      },
      pinataContent: json,
    };

    const res = await axios.post(url, params, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Successfully uploaded metadata to IPFS:", res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error uploading metadata to Pinata:", axiosError.message);
    throw new Error(`Failed to upload metadata to IPFS: ${axiosError.message}`);
  }
}

export async function uploadMusicGroupToPinata({
  audioFile,
  coverFile,
  metadata,
}: {
  audioFile: File | Buffer;
  coverFile: File | Buffer;
  metadata: {
    title: string;
    description?: string;
    artist?: string;
    [key: string]: any;
  };
}) {
  try {
    console.log("Starting music group upload to Pinata");
    console.log("Audio file:", {
      name: audioFile instanceof File ? audioFile.name : "Buffer",
      size: audioFile instanceof File ? audioFile.size : "Buffer size",
      type: audioFile instanceof File ? audioFile.type : "Buffer",
    });
    console.log("Cover file:", {
      name: coverFile instanceof File ? coverFile.name : "Buffer",
      size: coverFile instanceof File ? coverFile.size : "Buffer size",
      type: coverFile instanceof File ? coverFile.type : "Buffer",
    });

    // 1. Upload audio file
    const audioCid = await pinFileToIPFS(audioFile);

    // 2. Upload cover image
    const coverCid = await pinFileToIPFS(coverFile);

    // 3. Prepare and upload metadata
    const metadataWithLinks = {
      ...metadata,
      created_at: new Date().toISOString(),
    };

    const metadataCid = await pinJSONToIPFS(metadataWithLinks, "nft");

    const result = {
      audioCid,
      coverCid,
      metadataCid,
      metadataUri: `ipfs://${metadataCid}`,
      metadata: metadataWithLinks,
    };

    console.log("Successfully uploaded music group to IPFS:", result);
    return result;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Error in uploadMusicGroupToPinata:", axiosError.message);
    throw new Error(
      `Failed to upload music group to IPFS: ${axiosError.message}`
    );
  }
}
