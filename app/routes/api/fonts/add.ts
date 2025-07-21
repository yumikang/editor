import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as fs from "fs/promises";
import * as path from "path";
import type { CustomFont, FontCollection } from "~/types/font-types";

const FONTS_DATA_PATH = path.join(process.cwd(), "app/data/global/custom-fonts.json");

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const fontStr = formData.get("font") as string;
    
    if (!fontStr) {
      return json({ error: "Font data is required" }, { status: 400 });
    }
    
    const newFont: CustomFont = JSON.parse(fontStr);
    
    // Read existing data
    let fontCollection: FontCollection;
    try {
      const data = await fs.readFile(FONTS_DATA_PATH, "utf-8");
      fontCollection = JSON.parse(data);
    } catch {
      // Create new collection if file doesn't exist
      fontCollection = {
        fonts: [],
        metadata: {
          version: 1,
          lastUpdated: new Date().toISOString(),
          totalFonts: 0
        }
      };
    }
    
    // Check if font already exists
    const existingIndex = fontCollection.fonts.findIndex(
      f => f.cssUrl === newFont.cssUrl
    );
    
    if (existingIndex !== -1) {
      // Update existing font
      fontCollection.fonts[existingIndex] = newFont;
    } else {
      // Add new font
      fontCollection.fonts.push(newFont);
    }
    
    // Update metadata
    fontCollection.metadata.lastUpdated = new Date().toISOString();
    fontCollection.metadata.totalFonts = fontCollection.fonts.length;
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(FONTS_DATA_PATH), { recursive: true });
    
    // Save to file
    await fs.writeFile(FONTS_DATA_PATH, JSON.stringify(fontCollection, null, 2));
    
    return json({
      success: true,
      font: newFont,
      message: existingIndex !== -1 ? "Font updated" : "Font added"
    });
    
  } catch (error) {
    console.error("Error adding font:", error);
    return json({
      success: false,
      error: "Failed to add font"
    }, { status: 500 });
  }
};