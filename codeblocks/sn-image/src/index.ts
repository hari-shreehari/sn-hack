import Fastify from "fastify";
import { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import ImageKit from "imagekit";

import dotenv from "dotenv";
dotenv.config();

// config
const PORT = Number(process.env.PORT || 6969);
const IMAGEKIT_PUBLIC_KEY =
  process.env.IMAGEKIT_PUBLIC_KEY || "imagekit public key";
const IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY || "imagekit private key";
const IMAGEKIT_URL_ENDPOINT =
  process.env.IMAGEKIT_URL_ENDPOINT || "imagekit url endpoint";
const IMAGEKIT_FOLDER = process.env.IMAGEKIT_FOLDER || "imagekit folder";
const PAYLOAD_MAX_SIZE_IN_MB = Number(process.env.PAYLOAD_MAX_SIZE_IN_MB || 30);

const fastify = Fastify({
  bodyLimit: PAYLOAD_MAX_SIZE_IN_MB * 1024 * 1024,
});

fastify.register(cors, {
  origin: "*",
});

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
});

// types
interface UploadImagePayload {
  base64: string;
}

// utils
const generateUniqueFileName = (length: number = 5) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length)),
  ).join("");
};

// controllers
const uploadImage = async (
  request: FastifyRequest<{ Body: UploadImagePayload }>,
  reply: FastifyReply,
) => {
  const { base64 } = request.body;
  const uniqueFileID = generateUniqueFileName();
  try {
    const uploadResponse = await imagekit.upload({
      file: base64,
      fileName: uniqueFileID,
      overwriteFile: true,
      folder: IMAGEKIT_FOLDER,
    });

    const uploadedUrl = uploadResponse.url;
    const uploadedFileName = uploadResponse.name;

    fastify.log.info(`File ${uploadedFileName} uploaded successfully`);
    return reply.status(201).send({
      message: `Image Uploaded to imagekit successfully`,
      fileUrl: uploadedUrl,
    });
  } catch (e) {
    fastify.log.error(e);
    return reply
      .status(500)
      .send({ message: `Failed to upload Image: ${JSON.stringify(e)}` });
  }
};

// routes
fastify.get("/", async (_request: FastifyRequest, _reply: FastifyReply) => {
  return "za-warudo";
});
fastify.post("/upload-image", uploadImage);

const run = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

run();

// for serverless (vercel)
export default async function handler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  await fastify.ready();
  fastify.server.emit("request", req, reply);
}
