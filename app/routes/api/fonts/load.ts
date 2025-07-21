import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as fs from "fs/promises";
import * as path from "path";
import type { FontCollection } from "~/types/font-types";

const FONTS_DATA_PATH = path.join(process.cwd(), "app/data/global/custom-fonts.json");

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Check if file exists
    const fileExists = await fs.access(FONTS_DATA_PATH).then(() => true).catch(() => false);
    
    if (!fileExists) {
      // Return empty collection if file doesn't exist
      return json({
        success: true,
        fonts: [],
        metadata: {
          version: 1,
          lastUpdated: new Date().toISOString(),
          totalFonts: 0
        }
      });
    }
    
    // Read and parse font data
    const data = await fs.readFile(FONTS_DATA_PATH, "utf-8");
    const fontCollection: FontCollection = JSON.parse(data);
    
    return json({
      success: true,
      fonts: fontCollection.fonts,
      metadata: fontCollection.metadata
    });
    
  } catch (error) {
    console.error("Error loading fonts:", error);
    return json({
      success: false,
      error: "Failed to load fonts",
      fonts: []
    }, { status: 500 });
  }
};