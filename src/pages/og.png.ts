import { generateOgImageForSite } from "@utils/generateOgImages";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const buffer = await generateOgImageForSite();
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
};
