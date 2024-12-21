import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import multer from "multer";
const memoryStorage = multer.memoryStorage();
export const upload = multer({ storage: memoryStorage });

export const saveImage = async (image) => {
  const { buffer } = image;

  const splitNames = image.originalname.split(".");
  const ext = splitNames[splitNames.length - 1];

  const imageName = `${Date.now()}${crypto
    .randomBytes(20)
    .toString("hex")}.${ext}`;

  // Save the files
  await fs.writeFile(path.resolve(`data/image/${imageName}`), buffer);

  const url = `${process.env.SERVER_URL}/image/${imageName}`;
  return url;
};
