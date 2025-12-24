import sharp, { type Sharp } from "sharp";
import path from "path";
import fs from "node:fs/promises";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isProduction = process.env.NODE_ENV === "production";
const bucketName = process.env.AWS_S3_BUCKET_NAME;

const s3Client = isProduction
  ? new S3Client({
      region: process.env.AWS_DEFAULT_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
      forcePathStyle: true,
    })
  : null;

function ensureS3Config() {
  if (!s3Client || !bucketName) {
    throw new Error("S3 is not configured correctly for production uploads.");
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function buildObjectKey(folder: string, fileName: string) {
  return path.posix.join("uploads", folder, fileName);
}

function normalizeKey(keyOrUrl: string) {
  if (isHttpUrl(keyOrUrl)) {
    const url = new URL(keyOrUrl);
    return url.pathname.replace(/^\/+/, "");
  }
  return keyOrUrl.replace(/^\/+/, "");
}

export async function presignGetUrlForKey(
  key: string,
  expiresInSeconds = 60 * 15
) {
  if (!isProduction) return key;

  ensureS3Config();
  const cmd = new GetObjectCommand({
    Bucket: bucketName!,
    Key: key,
    ResponseCacheControl: "private, max-age=3600",
  });
  return getSignedUrl(s3Client!, cmd, { expiresIn: expiresInSeconds });
}

async function saveToLocalFilesystem(key: string, pngBuffer: Uint8Array) {
  const filePath = path.join(process.cwd(), "public", key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, pngBuffer);
  return "/" + key;
}

async function saveToS3(key: string, pngBuffer: Uint8Array) {
  ensureS3Config();
  await s3Client!.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: pngBuffer,
      ContentType: "image/png",
    })
  );
  return key;
}

export async function readImageBuffer(pathOrUrl: string): Promise<Buffer> {
  const normalized = normalizeKey(pathOrUrl);

  if (isHttpUrl(pathOrUrl)) {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(`Unable to fetch image from URL: ${pathOrUrl}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  if (isProduction) {
    const presigned = await presignGetUrlForKey(normalized);
    const response = await fetch(presigned);
    if (!response.ok) {
      throw new Error(`Unable to fetch image from storage: ${presigned}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const imagePath = path.join(process.cwd(), "public", normalized);
  return fs.readFile(imagePath);
}

export async function processAndSave(
  buffer: Buffer,
  folder: string = "closet"
): Promise<{ relativePath: string; img: Sharp }> {
  const fileName = `${Date.now()}.png`;
  const objectKey = buildObjectKey(folder, fileName);

  const baseImage = sharp(buffer)
    .rotate()
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat("png");
  const pngBuffer = await baseImage.toBuffer();
  const pngArray = new Uint8Array(pngBuffer);
  const img = sharp(pngBuffer);

  const relativePath = isProduction
    ? await saveToS3(objectKey, pngArray)
    : await saveToLocalFilesystem(objectKey, pngArray);

  return {
    relativePath,
    img,
  };
}
