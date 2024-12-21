import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fetch from "node-fetch";
async function preprocessImage(imageUrl) {
  try {
    // Fetch the image from URL
    const response = await fetch(imageUrl);
    const imageBuffer = await response.arrayBuffer();

    // Process the image
    const processedBuffer = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .threshold()
      .rotate()
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    console.error("Error preprocessing image:", error);
    throw error;
  }
}
export const extractTextFromImage = async (url) => {
  const processedBuffer = await preprocessImage(url);
  const worker = await createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  const { data } = await worker.recognize(processedBuffer, {
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,",
  });

  console.log(data.text);
  await worker.terminate();
};
