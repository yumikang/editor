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
    
    const updatedFont: CustomFont = JSON.parse(fontStr);
    
    // Read existing data
    const data = await fs.readFile(FONTS_DATA_PATH, "utf-8");
    const fontCollection: FontCollection = JSON.parse(data);
    
    // Find and update font
    const fontIndex = fontCollection.fonts.findIndex(f => f.id === updatedFont.id);
    
    if (fontIndex === -1) {
      return json({ error: "Font not found" }, { status: 404 });
    }
    
    // Update font
    fontCollection.fonts[fontIndex] = updatedFont;
    
    // Update metadata
    fontCollection.metadata.lastUpdated = new Date().toISOString();
    
    // Save to file
    await fs.writeFile(FONTS_DATA_PATH, JSON.stringify(fontCollection, null, 2));
    
    return json({
      success: true,
      font: updatedFont,
      message: "Font updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating font:", error);
    return json({
      success: false,
      error: "Failed to update font"
    }, { status: 500 });
  }
};